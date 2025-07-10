import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { Container } from '@/shared/components/layout/container'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'

export const metadata = {
  title: 'Reports - YardCard Elite',
  description: 'View analytics and reports for your yard sign rental business'
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ agency?: string }> }) {
  const { userId } = await auth()
  const resolvedSearchParams = await searchParams
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get agency slug from query parameter
  const agencySlug = resolvedSearchParams.agency

  if (!agencySlug) {
    redirect('/routing')
  }

  // Verify the agency exists and the user has access to it
  let agency, user
  try {
    const results = await Promise.all([
      getAgencyBySlug(agencySlug),
      getUserById(userId)
    ])
    agency = results[0]
    user = results[1]

    if (!agency) {
      redirect('/routing')
    }

    if (!user || user.agency?.slug !== agencySlug) {
      redirect('/routing')
    }
  } catch (error) {
    console.error('Reports: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Reports</h1>
          <p className="mt-3 text-lg text-neutral-600">
            View analytics, performance metrics, and financial reports for your business
          </p>
        </div>
        
        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Analytics & Reports</h3>
            <p className="text-neutral-600 mb-4">
              This page will provide detailed analytics, performance metrics, and financial reports for your yard sign rental business.
            </p>
            <p className="text-sm text-neutral-400">
              Coming soon - This feature is under development
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}