import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { Header } from '@/shared/components/layout/Header'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { MetricsSkeleton } from '@/features/dashboard/components/metrics-skeleton'
import { OrdersSkeleton } from '@/features/dashboard/components/orders-skeleton'
import { DashboardMetrics } from '@/features/dashboard/components/dashboard-metrics'
import { DashboardRecentOrders } from '@/features/dashboard/components/dashboard-recent-orders'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  // Mock user data for testing
  const user = {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com'
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
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
            Welcome back{user.firstName ? `, ${user.firstName}` : ''}! Here's an overview of your yard sign rental business.
          </p>
        </div>

        {/* New Dashboard with Server-side Rendering and Suspense */}
        <div className="space-y-8">
          {/* Metrics Grid */}
          <Suspense fallback={<MetricsSkeleton />}>
            <DashboardMetrics />
          </Suspense>

          {/* Recent Orders and Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<OrdersSkeleton />}>
              <DashboardRecentOrders />
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