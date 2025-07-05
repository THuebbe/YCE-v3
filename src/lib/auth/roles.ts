import { getCurrentAuthenticatedUser, type AuthenticatedUser } from '@/features/auth/utils'

// Import and re-export client-safe utilities and types
import {
  UserRoles,
  ROLE_HIERARCHY,
  Permissions,
  ROLE_PERMISSIONS,
  getUserPermissions as getPermissionsForUser,
  userHasPermission as checkUserPermission,
  userHasAnyPermission as checkUserAnyPermission,
  userHasRoleOrHigher as checkUserRoleOrHigher,
  getRoleDisplayName,
  getRoleDescription,
  getAvailableRoles,
  type UserRole,
  type Permission
} from './role-utils'

// Re-export with original names
export {
  UserRoles,
  ROLE_HIERARCHY,
  Permissions,
  ROLE_PERMISSIONS,
  getPermissionsForUser as getUserPermissions,
  checkUserPermission as userHasPermission,
  checkUserAnyPermission as userHasAnyPermission,
  checkUserRoleOrHigher as userHasRoleOrHigher,
  getRoleDisplayName,
  getRoleDescription,
  getAvailableRoles,
  type UserRole,
  type Permission
}

// Permission checking functions
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentAuthenticatedUser()
  return user?.role || null
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser()
  
  if (!user) {
    return false
  }
  
  // Super User automatically has access to all agency features
  if (user.role === 'SUPER_USER' && permission !== Permissions.SYSTEM_ADMIN) {
    return true
  }
  
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || []
  return userPermissions.includes(permission)
}

export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser()
  if (!user) return false
  
  // Super User automatically has access to all agency features
  if (user.role === 'SUPER_USER') {
    return permissions.some(p => p !== Permissions.SYSTEM_ADMIN)
  }
  
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || []
  return permissions.some(permission => userPermissions.includes(permission))
}

export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser()
  if (!user) return false
  
  // Super User automatically has access to all agency features
  if (user.role === 'SUPER_USER') {
    return permissions.every(p => p !== Permissions.SYSTEM_ADMIN)
  }
  
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || []
  return permissions.every(permission => userPermissions.includes(permission))
}

export async function hasRoleOrHigher(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser()
  if (!user) return false
  
  const userRoleLevel = ROLE_HIERARCHY[user.role as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

export async function canManageUser(targetUserId: string): Promise<boolean> {
  const currentUser = await getCurrentAuthenticatedUser()
  if (!currentUser) return false
  
  // Users cannot manage themselves for role changes
  if (currentUser.id === targetUserId) return false
  
  // Must have user management permissions
  return await hasPermission(Permissions.USERS_MANAGE_ROLES)
}

export async function canDeleteUser(targetUserId: string): Promise<boolean> {
  const currentUser = await getCurrentAuthenticatedUser()
  if (!currentUser) return false
  
  // Users cannot delete themselves
  if (currentUser.id === targetUserId) return false
  
  // Must have user deletion permissions
  return await hasPermission(Permissions.USERS_DELETE)
}

