import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { MetricsSkeleton } from '@/features/dashboard/components/metrics-skeleton'
import { OrdersSkeleton } from '@/features/dashboard/components/orders-skeleton'
import { DashboardMetrics } from '@/features/dashboard/components/dashboard-metrics'
import { DashboardRecentOrders } from '@/features/dashboard/components/dashboard-recent-orders'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ agency?: string }> }) {
  const { userId } = await auth()
  const resolvedSearchParams = await searchParams
  
  console.log('📊 Dashboard: Loading with search params:', resolvedSearchParams)
  
  if (!userId) {
    console.log('📊 Dashboard: No user ID, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Get agency slug from query parameter
  const agencySlug = resolvedSearchParams.agency
  console.log('📊 Dashboard: Agency slug from URL:', agencySlug)

  if (!agencySlug) {
    console.log('📊 Dashboard: No agency slug provided, redirecting to routing')
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
      console.log('📊 Dashboard: Agency not found:', agencySlug)
      redirect('/routing')
    }

    if (!user || user.agency?.slug !== agencySlug) {
      console.log('📊 Dashboard: User does not have access to agency:', agencySlug)
      redirect('/routing')
    }

    console.log('📊 Dashboard: Access verified for agency:', agencySlug, 'user:', user.id)
  } catch (error) {
    console.error('📊 Dashboard: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-neutral-600">
            Welcome back{user.firstName ? `, ${user.firstName}` : ''}! Here&apos;s an overview of {agency.name || 'your yard sign rental business'}.
          </p>
        </div>

        {/* New Dashboard with Server-side Rendering and Suspense */}
        <div className="space-y-8">
          {/* Metrics Grid */}
          <Suspense fallback={<MetricsSkeleton />}>
            <DashboardMetrics agencyId={agency.id} />
          </Suspense>

          {/* Recent Orders and Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<OrdersSkeleton />}>
              <DashboardRecentOrders agencyId={agency.id} />
            </Suspense>
            
            {/* Fallback: Keep existing overview for other features */}
            <div className="lg:col-span-1">
              <DashboardOverview />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}