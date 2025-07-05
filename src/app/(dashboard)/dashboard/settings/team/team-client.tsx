'use client';

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAction, removeUserAction } from '@/features/auth/team-actions'
import { type TeamData } from '@/features/auth/team-types'
import { 
  getRoleDisplayName, 
  getRoleDescription, 
  getAvailableRoles,
  type UserRole 
} from '@/lib/auth/role-utils'
import { Users, Shield, MoreVertical, UserPlus, AlertCircle, CheckCircle, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface TeamManagementClientProps {
  initialData: TeamData
}

export default function TeamManagementClient({ initialData }: TeamManagementClientProps) {
  const router = useRouter()
  const [teamData] = useState<TeamData>(initialData)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(teamData.error || null)
  const [isPending, startTransition] = useTransition()

  const refreshTeamData = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!teamData.currentUser) return

    try {
      setActionLoading(userId)
      setError(null)

      const result = await updateUserRoleAction(userId, newRole)
      if (result.success) {
        refreshTeamData()
        setShowRoleModal(null)
      } else {
        setError(result.error || 'Failed to update user role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!teamData.currentUser) return

    if (!confirm('Are you sure you want to remove this user from the team?')) {
      return;
    }

    try {
      setActionLoading(userId)
      setError(null)

      const result = await removeUserAction(userId)
      if (result.success) {
        refreshTeamData()
      } else {
        setError(result.error || 'Failed to remove user')
      }
    } catch (err) {
      console.error('Error removing user:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SUPER_USER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'USER':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading team settings...</span>
          </div>
        </div>
      </main>
    )
  }

  if (error && !teamData.currentUser) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-primary" />
                Team Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your team members, roles, and permissions
              </p>
            </div>
            
            {teamData.canInviteUsers && (
              <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </button>
            )}
          </div>

          {/* Current user info */}
          {teamData.currentUser && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  You are signed in as <strong>{teamData.currentUser.firstName} {teamData.currentUser.lastName}</strong> with {' '}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(teamData.currentUser.role as UserRole)}`}>
                    {getRoleDisplayName(teamData.currentUser.role as UserRole)}
                  </span> permissions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Team Members ({teamData.teamMembers.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {teamData.teamMembers.map((member) => (
              <div key={member.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                        {member.id === teamData.currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Role Badge */}
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role as UserRole)}`}>
                        {getRoleDisplayName(member.role as UserRole)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {getRoleDescription(member.role as UserRole)}
                      </p>
                    </div>

                    {/* Actions */}
                    {(member.canEdit || member.canDelete) && (
                      <div className="relative">
                        <button
                          onClick={() => setShowRoleModal(showRoleModal === member.id ? null : member.id)}
                          disabled={actionLoading === member.id}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {actionLoading === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </button>

                        {/* Dropdown Menu */}
                        {showRoleModal === member.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            {member.canEdit && teamData.currentUser && (
                              <div className="p-2">
                                <p className="text-xs font-medium text-gray-700 mb-2">Change Role</p>
                                {getAvailableRoles(teamData.currentUser.role as UserRole).map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleRoleChange(member.id, role)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between"
                                  >
                                    <span>{getRoleDisplayName(role)}</span>
                                    {member.role === role && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {member.canDelete && (
                              <>
                                {member.canEdit && <div className="border-t border-gray-100" />}
                                <div className="p-2">
                                  <button
                                    onClick={() => handleRemoveUser(member.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                  >
                                    Remove from team
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Information */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Role Descriptions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries({
                USER: 'USER',
                MANAGER: 'MANAGER',
                ADMIN: 'ADMIN',
                SUPER_USER: 'SUPER_USER',
                SUPER_ADMIN: 'SUPER_ADMIN'
              }).map(([key, role]) => (
                <div key={key} className="flex items-start space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role as UserRole)} flex-shrink-0`}>
                    {getRoleDisplayName(role as UserRole)}
                  </span>
                  <p className="text-sm text-gray-600">
                    {getRoleDescription(role as UserRole)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Click outside to close modal */}
        {showRoleModal && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowRoleModal(null)}
          />
        )}
    </main>
  )
}