import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
// import { getDashboardMetrics, getRecentOrders, getPlatformPopularSigns } from '@/features/dashboard/actions'

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Re-enable when dashboard actions are reimplemented with Supabase
    // Temporary mock data to prevent build errors
    const dashboardData = {
      openOrders: 0,
      upcomingOrders: [],
      popularSigns: [],
      revenue: {
        current: 0,
        previous: 0,
        change: 0
      },
      recentOrders: [],
      platformPopularSigns: [],
      metrics: {
        completedOrdersThisMonth: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        deployedOrders: 0
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}