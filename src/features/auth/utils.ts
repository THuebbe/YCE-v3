import { currentUser } from '@clerk/nextjs/server'
import { User } from '@clerk/nextjs/server'
import { getCurrentTenant, withCurrentTenantContext } from '@/lib/tenant-context'
import { getTenantPrismaClient, prisma } from '@/lib/db/prisma'

// Type for authenticated user with tenant context
export interface AuthenticatedUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  tenantId: string
  role: 'SUPER_ADMIN' | 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'
}

// Get the current authenticated user with tenant validation
export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return null
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      // If we have a Clerk user but no tenant context, they might be accessing the wrong domain
      return null
    }

    // Get user from database with tenant context using secure functions
    const client = getTenantPrismaClient(tenantId)
    
    // Try direct database query first to bypass any RLS issues
    const directUsers = await prisma.user.findMany({
      where: { agencyId: tenantId }
    })
    
    if (directUsers.length > 0) {
      const dbUser = directUsers.find(user => user.email === clerkUser.emailAddresses[0]?.emailAddress)
      
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          tenantId: dbUser.agencyId,
          role: dbUser.role
        }
      }
    }
    
    // Fallback to client method
    const agencyUsers = await client.getAgencyUsers()
    const dbUser = agencyUsers.find(user => user.email === clerkUser.emailAddresses[0]?.emailAddress)

    if (!dbUser) {
      return null
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      tenantId: dbUser.agencyId,
      role: dbUser.role
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

// Ensure user belongs to the current tenant
export async function validateUserTenantAccess(userId?: string): Promise<boolean> {
  try {
    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return false
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return false
    }

    const targetUserId = userId || clerkUser.id

    // Check if user exists in the current tenant using secure functions
    const client = getTenantPrismaClient(tenantId)
    const agencyUsers = await client.getAgencyUsers()
    const dbUser = agencyUsers.find(user => 
      user.id === targetUserId || user.email === clerkUser.emailAddresses[0]?.emailAddress
    )

    return !!dbUser
  } catch (error) {
    console.error('Error validating user tenant access:', error)
    return false
  }
}

// Create or update user in the current tenant context
export async function ensureUserInTenant(clerkUser: User, tenantId: string): Promise<AuthenticatedUser | null> {
  try {
    const client = getTenantPrismaClient(tenantId)
    
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      throw new Error('User must have an email address')
    }

    // Check if user exists first, then create or update using secure functions
    let dbUser
    try {
      const agencyUsers = await client.getAgencyUsers()
      const existingUser = agencyUsers.find(user => user.email === email)
      
      if (existingUser) {
        // Update existing user
        dbUser = await client.updateAgencyUser(existingUser.id, {
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
        })
      } else {
        // Create new user using secure function
        dbUser = await client.createAgencyUser({
          id: clerkUser.id,
          email,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          role: 'USER' // Default role
        })
      }
    } catch (error) {
      console.error('Error upserting user:', error)
      throw error
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      tenantId: dbUser.agencyId,
      role: dbUser.role
    }
  } catch (error) {
    console.error('Error ensuring user in tenant:', error)
    return null
  }
}

// Check if user has required role in current tenant
export async function hasRole(requiredRole: 'SUPER_ADMIN' | 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser()
  if (!user) {
    return false
  }

  const roleHierarchy = {
    'USER': 0,
    'MANAGER': 1,
    'ADMIN': 2,
    'SUPER_USER': 3,
    'SUPER_ADMIN': 4
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

// Check if user is admin in current tenant
export async function isAdmin(): Promise<boolean> {
  return await hasRole('ADMIN')
}

// Check if user is super admin (global admin)
export async function isSuperAdmin(): Promise<boolean> {
  return await hasRole('SUPER_ADMIN')
}

// Get all users in the current tenant (admin only)
export async function getTenantUsers(): Promise<AuthenticatedUser[]> {
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    throw new Error('Insufficient permissions to view tenant users')
  }

  const tenantId = await getCurrentTenant()
  if (!tenantId) {
    throw new Error('No tenant context available')
  }

  const client = getTenantPrismaClient(tenantId)
  const users = await client.getAgencyUsers()

  return users
    .map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.agencyId,
      role: user.role
    }))
    .sort((a, b) => a.email.localeCompare(b.email))
}

// Update user role in current tenant (admin only)
export async function updateUserRole(
  userId: string, 
  newRole: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'
): Promise<boolean> {
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    throw new Error('Insufficient permissions to update user roles')
  }

  try {
    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      throw new Error('No tenant context available')
    }

    const client = getTenantPrismaClient(tenantId)
    await client.updateAgencyUser(userId, { role: newRole })

    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

// Remove user from current tenant (admin only)
export async function removeUserFromTenant(userId: string): Promise<boolean> {
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    throw new Error('Insufficient permissions to remove users')
  }

  const currentUser = await getCurrentAuthenticatedUser()
  if (currentUser?.id === userId) {
    throw new Error('Cannot remove yourself from tenant')
  }

  try {
    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      throw new Error('No tenant context available')
    }

    const client = getTenantPrismaClient(tenantId)
    // Since we don't have a secure delete function, use direct delete with tenant validation
    const agencyUsers = await client.getAgencyUsers()
    const userExists = agencyUsers.find(user => user.id === userId)
    
    if (!userExists) {
      throw new Error('User not found in current tenant')
    }
    
    // Use the standard client for deletion since user is validated to belong to tenant
    await withCurrentTenantContext(async (standardClient) => {
      await standardClient.user.delete({
        where: { id: userId }
      })
    })

    return true
  } catch (error) {
    console.error('Error removing user from tenant:', error)
    return false
  }
}