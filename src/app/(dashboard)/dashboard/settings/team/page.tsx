import { Suspense } from 'react'
import { getTeamData } from '@/features/auth/team-actions'
import TeamManagementClient from './team-client'
import { Header } from '@/shared/components/layout/Header'
import { Loader2 } from 'lucide-react'

// Server Component
export default async function TeamSettingsPage() {
  const teamData = await getTeamData()

  return (
    <div className="min-h-screen bg-background-white">
      <Header />
      <Suspense fallback={<TeamPageLoading />}>
        <TeamManagementClient initialData={teamData} />
      </Suspense>
    </div>
  )
}

function TeamPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading team settings...</span>
      </div>
    </div>
  )
}