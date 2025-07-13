import { currentUser } from '@clerk/nextjs/server'
import { User } from '@clerk/nextjs/server'
import { getCurrentTenant, withCurrentTenantContext } from '@/lib/tenant-context'
// import { getTenantPrismaClient, prisma } from '@/lib/db/prisma'
import { supabase } from '@/lib/db/supabase-client'

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

    // Get user from database using Supabase
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('agencyId', tenantId)
      .eq('email', clerkUser.emailAddresses[0]?.emailAddress)
      .single()
    
    if (error || !dbUser) {
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

    // Check if user exists in the current tenant using Supabase
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('agencyId', tenantId)
      .or(`id.eq.${targetUserId},email.eq.${clerkUser.emailAddresses[0]?.emailAddress}`)
      .single()

    return !!dbUser
  } catch (error) {
    console.error('Error validating user tenant access:', error)
    return false
  }
}

// Create or update user in the current tenant context
export async function ensureUserInTenant(clerkUser: User, tenantId: string): Promise<AuthenticatedUser | null> {
  // TODO: Implement with Supabase
  console.warn('ensureUserInTenant not implemented for Supabase')
  return null
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
  // TODO: Implement with Supabase
  console.warn('getTenantUsers not implemented for Supabase')
  return []
}

// Update user role in current tenant (admin only)
export async function updateUserRole(
  userId: string, 
  newRole: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'
): Promise<boolean> {
  // TODO: Implement with Supabase
  console.warn('updateUserRole not implemented for Supabase')
  return false
}

// Remove user from current tenant (admin only)
export async function removeUserFromTenant(userId: string): Promise<boolean> {
  // TODO: Implement with Supabase
  console.warn('removeUserFromTenant not implemented for Supabase')
  return false
}