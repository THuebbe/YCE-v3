import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { Container } from '@/shared/components/layout/container'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'

export const metadata = {
  title: 'Inventory - YardCard Elite',
  description: 'Manage your yard sign inventory and stock levels'
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ agency?: string }> }) {
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
    console.error('Inventory: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Inventory</h1>
          <p className="mt-3 text-lg text-neutral-600">
            Manage your yard sign inventory, track stock levels, and monitor availability
          </p>
        </div>
        
        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Inventory Management</h3>
            <p className="text-neutral-600 mb-4">
              This page will help you manage your yard sign inventory, track stock levels, and monitor availability.
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