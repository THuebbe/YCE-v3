import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { Header } from '@/shared/components/layout/Header'
import { AgencyProfileSection } from './components/AgencyProfileSection'

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

            {/* Financial Management Section - Coming Soon */}
            <section>
              <div className="bg-white rounded-lg shadow-default p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Financial Management
                  </h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-4">
                    Configure payment processing, Stripe Connect, and pricing settings.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Coming in Phase 2
                  </div>
                </div>
              </div>
            </section>

            {/* Agency Settings Section - Coming Soon */}
            <section>
              <div className="bg-white rounded-lg shadow-default p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Operational Settings
                  </h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-4">
                    Configure business hours, blackout dates, booking policies, and customer experience.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Coming in Phase 3
                  </div>
                </div>
              </div>
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