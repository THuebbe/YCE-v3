'use server'

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma, getTenantPrismaClient } from '@/lib/db/prisma'
import { 
  createAgencySchema, 
  checkSubdomainSchema,
  type CreateAgencyResult,
  type SubdomainCheckResult 
} from '@/lib/validation'
import { hasPermission, Permissions } from '@/lib/auth/roles'

// Check if a subdomain is available
export async function checkSubdomainAvailability(slug: string): Promise<SubdomainCheckResult> {
  try {
    // Validate input
    const result = checkSubdomainSchema.safeParse({ slug })
    if (!result.success) {
      return {
        available: false,
        message: result.error.errors[0]?.message || 'Invalid subdomain'
      }
    }

    // Check if subdomain already exists
    const existingAgency = await prisma.agency.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (existingAgency) {
      return {
        available: false,
        message: 'This subdomain is already taken'
      }
    }

    return {
      available: true,
      message: 'Subdomain is available'
    }
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return {
      available: false,
      message: 'Unable to check subdomain availability'
    }
  }
}

// Create a new agency
export async function createAgency(formData: FormData): Promise<CreateAgencyResult> {
  console.log('🏢 createAgency server action called with:', Object.fromEntries(formData))
  console.trace('createAgency server action stack trace')
  
  try {
    // Get current user
    const user = await currentUser()
    if (!user) {
      return {
        success: false,
        error: 'You must be signed in to create an agency'
      }
    }

    // Check permissions for agency creation (onboarding users can always create)
    // In a production app, you might want to restrict this further
    // For now, any authenticated user can create an agency during onboarding

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || undefined,
    }

    const validationResult = createAgencySchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Invalid form data'
      }
    }

    const { name, slug, description } = validationResult.data

    // Double-check subdomain availability
    const availabilityCheck = await checkSubdomainAvailability(slug)
    if (!availabilityCheck.available) {
      return {
        success: false,
        error: availabilityCheck.message
      }
    }

    // Create the agency using secure context
    const agency = await prisma.agency.create({
      data: {
        name,
        slug,
        description,
        isActive: true,
      }
    })

    // Create the user record in the new agency using secure functions
    // Set the agency context for secure operations
    const tenantClient = getTenantPrismaClient(agency.id)
    
    // Check if user already exists using secure functions
    try {
      const agencyUsers = await tenantClient.getAgencyUsers()
      const existingUser = agencyUsers.find(u => u.id === user.id || u.email === user.emailAddresses[0]?.emailAddress)
      
      if (existingUser) {
        console.log('👤 User already exists, updating agency association')
        // Update existing user to be associated with new agency as admin
        await tenantClient.updateAgencyUser(existingUser.id, {
          firstName: user.firstName || existingUser.firstName,
          lastName: user.lastName || existingUser.lastName,
          role: 'ADMIN' // Agency creator becomes admin
        })
      } else {
        console.log('👤 Creating new user for agency using secure functions')
        // Create new user using secure function
        await tenantClient.createAgencyUser({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: 'ADMIN' // Agency creator becomes admin
        })
      }
    } catch (secureError) {
      // Fallback to direct creation if secure functions fail
      console.warn('Secure functions failed, using direct creation:', secureError)
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: 'ADMIN',
          agencyId: agency.id,
        }
      })
    }

    return {
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug
      }
    }
  } catch (error) {
    console.error('❌ Error creating agency:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error
    })
    return {
      success: false,
      error: `Failed to create agency: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

// Complete onboarding and redirect to dashboard
export async function completeOnboarding(agencySlug: string) {
  // Check if user is authenticated
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Redirect to the agency's dashboard (use http for localhost development)
  redirect(`http://${agencySlug}.localhost:3000/dashboard`)
}

// Server action to update user role (protected)
export async function updateUserRoleAction(
  userId: string,
  newRole: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has permission to manage roles
    const canManageRoles = await hasPermission(Permissions.USERS_MANAGE_ROLES)
    if (!canManageRoles) {
      return {
        success: false,
        error: 'You do not have permission to manage user roles'
      }
    }

    // Get current user for validation
    const currentAuthUser = await currentUser()
    if (!currentAuthUser) {
      return {
        success: false,
        error: 'You must be signed in to update user roles'
      }
    }

    // Prevent users from changing their own role
    if (currentAuthUser.id === userId) {
      return {
        success: false,
        error: 'You cannot change your own role'
      }
    }

    // Use the existing updateUserRole function from auth utils
    const { updateUserRole } = await import('@/features/auth/utils')
    const success = await updateUserRole(userId, newRole)

    return {
      success,
      error: success ? undefined : 'Failed to update user role'
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role'
    }
  }
}

// Server action to remove user from agency (protected)
export async function removeUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has permission to delete users
    const canDeleteUsers = await hasPermission(Permissions.USERS_DELETE)
    if (!canDeleteUsers) {
      return {
        success: false,
        error: 'You do not have permission to remove users'
      }
    }

    // Get current user for validation
    const currentAuthUser = await currentUser()
    if (!currentAuthUser) {
      return {
        success: false,
        error: 'You must be signed in to remove users'
      }
    }

    // Prevent users from removing themselves
    if (currentAuthUser.id === userId) {
      return {
        success: false,
        error: 'You cannot remove yourself from the agency'
      }
    }

    // Use the existing removeUserFromTenant function from auth utils
    const { removeUserFromTenant } = await import('@/features/auth/utils')
    const success = await removeUserFromTenant(userId)

    return {
      success,
      error: success ? undefined : 'Failed to remove user'
    }
  } catch (error) {
    console.error('Error removing user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove user'
    }
  }
}