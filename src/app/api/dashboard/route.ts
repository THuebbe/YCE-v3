import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDashboardMetrics, getUpcomingOrdersByAgency, getUserById } from '@/lib/db/supabase-client'

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's agency information
    const user = await getUserById(userId)
    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 400 })
    }

    // Fetch real dashboard data
    console.log('📊 Dashboard API: Fetching data for agency:', user.agencyId)
    
    const [dashboardMetrics, upcomingOrders] = await Promise.all([
      getDashboardMetrics(user.agencyId),
      getUpcomingOrdersByAgency(user.agencyId, 10)
    ])

    // Calculate revenue change percentage
    const revenueChange = dashboardMetrics.previousMonthRevenue > 0 
      ? ((dashboardMetrics.monthlyRevenue - dashboardMetrics.previousMonthRevenue) / dashboardMetrics.previousMonthRevenue) * 100 
      : 0

    const dashboardData = {
      openOrders: dashboardMetrics.openOrdersCount || 0,
      upcomingOrders: upcomingOrders || [],
      popularSigns: [], // TODO: Implement in Phase 2
      revenue: {
        current: dashboardMetrics.monthlyRevenue || 0,
        previous: dashboardMetrics.previousMonthRevenue || 0,
        change: Math.round(revenueChange * 100) / 100 // Round to 2 decimal places
      },
      recentOrders: [],
      platformPopularSigns: [],
      metrics: {
        completedOrdersThisMonth: dashboardMetrics.completedOrdersCount || 0,
        averageOrderValue: Math.round((dashboardMetrics.averageOrderValue || 0) * 100) / 100,
        pendingOrders: 0, // TODO: Add specific status counts if needed
        processingOrders: 0,
        deployedOrders: 0
      }
    }

    console.log('✅ Dashboard API: Returning data with', upcomingOrders?.length || 0, 'upcoming orders')
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}