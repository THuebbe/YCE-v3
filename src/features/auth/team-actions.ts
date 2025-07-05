'use server'

import { getCurrentAuthenticatedUser, getTenantUsers, updateUserRole, removeUserFromTenant, type AuthenticatedUser } from '@/features/auth/utils'
import { hasPermission, userHasPermission, Permissions, type UserRole } from '@/lib/auth/roles'
import { currentUser } from '@clerk/nextjs/server'
import { type TeamMember, type TeamData } from './team-types'

// Server action to get team data
export async function getTeamData(): Promise<TeamData> {
  try {
    // Get current user
    const user = await getCurrentAuthenticatedUser()
    
    if (!user) {
      return {
        currentUser: null,
        teamMembers: [],
        canInviteUsers: false,
        error: 'You must be logged in to view team settings'
      }
    }

    // Check if user has permission to view team
    const canViewTeam = await hasPermission(Permissions.USERS_VIEW)
    
    if (!canViewTeam) {
      return {
        currentUser: user,
        teamMembers: [],
        canInviteUsers: false,
        error: 'You do not have permission to view team settings'
      }
    }

    // Load team members
    const users = await getTenantUsers()
    const membersWithPermissions: TeamMember[] = users.map(member => ({
      ...member,
      canEdit: userHasPermission(user, Permissions.USERS_MANAGE_ROLES) && member.id !== user.id,
      canDelete: userHasPermission(user, Permissions.USERS_DELETE) && member.id !== user.id
    }))

    const canInviteUsers = userHasPermission(user, Permissions.USERS_CREATE)

    return {
      currentUser: user,
      teamMembers: membersWithPermissions,
      canInviteUsers,
    }
  } catch (err) {
    console.error('Error loading team data:', err)
    return {
      currentUser: null,
      teamMembers: [],
      canInviteUsers: false,
      error: err instanceof Error ? err.message : 'Failed to load team data'
    }
  }
}

// Server action to update user role
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
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

    // Update the role
    const success = await updateUserRole(userId, newRole as 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER')

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

// Server action to remove user
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

    // Remove the user
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