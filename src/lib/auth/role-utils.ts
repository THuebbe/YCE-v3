import { type AuthenticatedUser } from '@/features/auth/utils'

// Define user roles in hierarchical order
export const UserRoles = {
  USER: 'USER',
  MANAGER: 'MANAGER', 
  ADMIN: 'ADMIN',
  SUPER_USER: 'SUPER_USER',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const

export type UserRole = keyof typeof UserRoles

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  MANAGER: 1,
  ADMIN: 2,
  SUPER_USER: 3,
  SUPER_ADMIN: 4
}

// Define permissions for different resources and actions
export const Permissions = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  
  // Agency management
  AGENCY_VIEW: 'agency:view',
  AGENCY_UPDATE: 'agency:update',
  AGENCY_DELETE: 'agency:delete',
  AGENCY_SETTINGS: 'agency:settings',
  
  // Client management
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // Service management
  SERVICES_VIEW: 'services:view',
  SERVICES_CREATE: 'services:create',
  SERVICES_UPDATE: 'services:update',
  SERVICES_DELETE: 'services:delete',
  
  // Booking management
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_UPDATE: 'bookings:update',
  BOOKINGS_DELETE: 'bookings:delete',
  BOOKINGS_ASSIGN: 'bookings:assign',
  
  // Financial data
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_EXPORT: 'financial:export',
  
  // Reports and analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Super User - Agency feature access
  AGENCY_FEATURES_ALL: 'agency_features:all',
  
  // System administration (SUPER_ADMIN only)
  SYSTEM_ADMIN: 'system:admin'
} as const

export type Permission = typeof Permissions[keyof typeof Permissions]

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    Permissions.CLIENTS_VIEW,
    Permissions.SERVICES_VIEW,
    Permissions.BOOKINGS_VIEW,
    Permissions.BOOKINGS_CREATE,
    Permissions.BOOKINGS_UPDATE
  ],
  
  MANAGER: [
    Permissions.CLIENTS_VIEW,
    Permissions.CLIENTS_CREATE,
    Permissions.CLIENTS_UPDATE,
    Permissions.SERVICES_VIEW,
    Permissions.SERVICES_CREATE,
    Permissions.SERVICES_UPDATE,
    Permissions.BOOKINGS_VIEW,
    Permissions.BOOKINGS_CREATE,
    Permissions.BOOKINGS_UPDATE,
    Permissions.BOOKINGS_DELETE,
    Permissions.BOOKINGS_ASSIGN,
    Permissions.USERS_VIEW,
    Permissions.REPORTS_VIEW
  ],
  
  ADMIN: [
    Permissions.CLIENTS_VIEW,
    Permissions.CLIENTS_CREATE,
    Permissions.CLIENTS_UPDATE,
    Permissions.CLIENTS_DELETE,
    Permissions.SERVICES_VIEW,
    Permissions.SERVICES_CREATE,
    Permissions.SERVICES_UPDATE,
    Permissions.SERVICES_DELETE,
    Permissions.BOOKINGS_VIEW,
    Permissions.BOOKINGS_CREATE,
    Permissions.BOOKINGS_UPDATE,
    Permissions.BOOKINGS_DELETE,
    Permissions.BOOKINGS_ASSIGN,
    Permissions.USERS_VIEW,
    Permissions.USERS_CREATE,
    Permissions.USERS_UPDATE,
    Permissions.USERS_DELETE,
    Permissions.USERS_MANAGE_ROLES,
    Permissions.AGENCY_VIEW,
    Permissions.AGENCY_UPDATE,
    Permissions.AGENCY_SETTINGS,
    Permissions.FINANCIAL_VIEW,
    Permissions.FINANCIAL_EXPORT,
    Permissions.REPORTS_VIEW,
    Permissions.REPORTS_EXPORT
  ],
  
  SUPER_USER: [
    // Super User gets automatic access to ALL agency features
    Permissions.AGENCY_FEATURES_ALL,
    // Plus all regular permissions
    Permissions.CLIENTS_VIEW,
    Permissions.CLIENTS_CREATE,
    Permissions.CLIENTS_UPDATE,
    Permissions.CLIENTS_DELETE,
    Permissions.SERVICES_VIEW,
    Permissions.SERVICES_CREATE,
    Permissions.SERVICES_UPDATE,
    Permissions.SERVICES_DELETE,
    Permissions.BOOKINGS_VIEW,
    Permissions.BOOKINGS_CREATE,
    Permissions.BOOKINGS_UPDATE,
    Permissions.BOOKINGS_DELETE,
    Permissions.BOOKINGS_ASSIGN,
    Permissions.USERS_VIEW,
    Permissions.USERS_CREATE,
    Permissions.USERS_UPDATE,
    Permissions.USERS_DELETE,
    Permissions.USERS_MANAGE_ROLES,
    Permissions.AGENCY_VIEW,
    Permissions.AGENCY_UPDATE,
    Permissions.AGENCY_SETTINGS,
    Permissions.FINANCIAL_VIEW,
    Permissions.FINANCIAL_EXPORT,
    Permissions.REPORTS_VIEW,
    Permissions.REPORTS_EXPORT
  ],
  
  SUPER_ADMIN: [
    // All SUPER_USER permissions plus system admin
    Permissions.AGENCY_FEATURES_ALL,
    Permissions.CLIENTS_VIEW,
    Permissions.CLIENTS_CREATE,
    Permissions.CLIENTS_UPDATE,
    Permissions.CLIENTS_DELETE,
    Permissions.SERVICES_VIEW,
    Permissions.SERVICES_CREATE,
    Permissions.SERVICES_UPDATE,
    Permissions.SERVICES_DELETE,
    Permissions.BOOKINGS_VIEW,
    Permissions.BOOKINGS_CREATE,
    Permissions.BOOKINGS_UPDATE,
    Permissions.BOOKINGS_DELETE,
    Permissions.BOOKINGS_ASSIGN,
    Permissions.USERS_VIEW,
    Permissions.USERS_CREATE,
    Permissions.USERS_UPDATE,
    Permissions.USERS_DELETE,
    Permissions.USERS_MANAGE_ROLES,
    Permissions.AGENCY_VIEW,
    Permissions.AGENCY_UPDATE,
    Permissions.AGENCY_DELETE,
    Permissions.AGENCY_SETTINGS,
    Permissions.FINANCIAL_VIEW,
    Permissions.FINANCIAL_EXPORT,
    Permissions.REPORTS_VIEW,
    Permissions.REPORTS_EXPORT,
    Permissions.SYSTEM_ADMIN
  ]
}

// UI helper functions for conditional rendering (CLIENT-SAFE)
export function getUserPermissions(user: AuthenticatedUser | null): Permission[] {
  if (!user) return []
  return ROLE_PERMISSIONS[user.role as UserRole] || []
}

export function userHasPermission(user: AuthenticatedUser | null, permission: Permission): boolean {
  if (!user) return false
  
  // Super User automatically has access to all agency features
  if (user.role === 'SUPER_USER' && permission !== Permissions.SYSTEM_ADMIN) {
    return true
  }
  
  const userPermissions = getUserPermissions(user)
  return userPermissions.includes(permission)
}

export function userHasAnyPermission(user: AuthenticatedUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  
  // Super User automatically has access to all agency features
  if (user.role === 'SUPER_USER') {
    return permissions.some(p => p !== Permissions.SYSTEM_ADMIN)
  }
  
  const userPermissions = getUserPermissions(user)
  return permissions.some(permission => userPermissions.includes(permission))
}

export function userHasRoleOrHigher(user: AuthenticatedUser | null, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const userRoleLevel = ROLE_HIERARCHY[user.role as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

// Role display helpers (CLIENT-SAFE)
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    USER: 'User',
    MANAGER: 'Manager',
    ADMIN: 'Admin',
    SUPER_USER: 'Super User',
    SUPER_ADMIN: 'Super Admin'
  }
  return roleNames[role] || role
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    USER: 'Can view data and manage own bookings',
    MANAGER: 'Can manage clients, services, and team bookings',
    ADMIN: 'Full access to agency management and settings',
    SUPER_USER: 'Automatic access to all agency features',
    SUPER_ADMIN: 'System-wide administration access'
  }
  return descriptions[role] || ''
}

export function getAvailableRoles(currentUserRole: UserRole): UserRole[] {
  const currentRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0
  
  return Object.keys(ROLE_HIERARCHY)
    .filter(role => ROLE_HIERARCHY[role as UserRole] < currentRoleLevel)
    .sort((a, b) => ROLE_HIERARCHY[a as UserRole] - ROLE_HIERARCHY[b as UserRole]) as UserRole[]
}