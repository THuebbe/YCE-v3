import { type AuthenticatedUser } from '@/features/auth/utils'

export interface TeamMember extends AuthenticatedUser {
  canEdit: boolean
  canDelete: boolean
}

export interface TeamData {
  currentUser: AuthenticatedUser | null
  teamMembers: TeamMember[]
  canInviteUsers: boolean
  error?: string
}