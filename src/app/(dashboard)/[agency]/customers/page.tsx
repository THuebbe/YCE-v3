import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { Container } from '@/shared/components/layout/container'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'

export const metadata = {
  title: 'Customers - YardCard Elite',
  description: 'Manage your customer relationships and contact information'
}

export default async function CustomersPage({ 
  params 
}: { 
  params: Promise<{ agency: string }> 
}) {
  const { userId } = await auth()
  const resolvedParams = await params
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get agency slug from URL parameter
  const agencySlug = resolvedParams.agency

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
    console.error('Customers: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Customers</h1>
          <p className="mt-3 text-lg text-neutral-600">
            Manage your customer relationships, contact information, and order history
          </p>
        </div>
        
        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Customer Management</h3>
            <p className="text-neutral-600 mb-4">
              This page will help you manage your customer relationships, track contact information, and view order history.
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