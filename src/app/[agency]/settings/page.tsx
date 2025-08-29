import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { Header } from '@/shared/components/layout/Header'
import { AgencyProfileSection } from './components/AgencyProfileSection'
import FinancialManagementSection from './components/FinancialManagementSection'
import AgencySettingsSection from './components/AgencySettingsSection'

interface SettingsPageProps {
  params: Promise<{
    agency: string
  }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { userId } = await auth()
  const { agency: agencySlug } = await params

  if (!userId) {
    redirect('/auth/sign-in')
  }

  // Verify agency access and permissions
  try {
    const results = await Promise.all([
      getAgencyBySlug(agencySlug),
      getUserById(userId),
    ])
    const [agency, user] = results

    if (!agency || !user || user.agency?.slug !== agencySlug) {
      redirect('/routing')
    }

    // Check if user has permission to manage agency settings
    const hasSettingsPermission = user.role === 'ADMIN' || 
                                 user.role === 'SUPER_USER' || 
                                 user.role === 'SUPER_ADMIN'
    
    if (!hasSettingsPermission) {
      redirect(`/${agencySlug}/dashboard`)
    }

    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Manage Agency Settings
            </h1>
            <p className="text-neutral-600">
              Configure your agency profile, payment settings, and operational preferences.
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Agency Profile Section */}
            <section>
              <AgencyProfileSection 
                agency={agency}
                agencySlug={agencySlug}
              />
            </section>

            {/* Financial Management Section */}
            <section>
              <FinancialManagementSection agency={agency} />
            </section>

            {/* Agency Settings Section */}
            <section>
              <AgencySettingsSection agency={agency} />
            </section>

            {/* Team Management Section - Future Feature */}
            <section>
              <div className="bg-white rounded-lg shadow-default p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Team Management
                  </h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-4">
                    Invite team members, manage roles, and control access permissions.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    Future Feature
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading settings page:', error)
    redirect('/routing')
  }
}