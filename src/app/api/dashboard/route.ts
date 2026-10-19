import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDashboardMetrics, getUpcomingOrdersByAgency, getUserById } from '@/lib/db/supabase-client'
import { hasFeature, planOf } from '@/features/billing/entitlements'
import { getPopularDisplays } from '@/features/dashboard/popular-displays'

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's agency information
    const user = await getUserById(userId)
    if (!user?.agency_id) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 400 })
    }

    // Fetch real dashboard data
    console.log('📊 Dashboard API: Fetching data for agency:', user.agency_id)
    
    const plan = planOf(user.agency)
    const showPopular = hasFeature(plan, 'popularDisplays')
    const [dashboardMetrics, upcomingOrders, popular] = await Promise.all([
      getDashboardMetrics(user.agency_id),
      getUpcomingOrdersByAgency(user.agency_id, 10),
      showPopular ? getPopularDisplays(user.agency_id) : Promise.resolve(null)
    ])

    // Calculate revenue change percentage
    const revenueChange = dashboardMetrics.previousMonthRevenue > 0 
      ? ((dashboardMetrics.monthlyRevenue - dashboardMetrics.previousMonthRevenue) / dashboardMetrics.previousMonthRevenue) * 100 
      : 0

    // Revenue is Elite; Essentials gets the order counts only
    const showRevenue = hasFeature(plan, 'revenueMetrics')
    const dashboardData = {
      openOrders: dashboardMetrics.openOrdersCount || 0,
      upcomingOrders: upcomingOrders || [],
      // Elite; null tells the card to show the upgrade note
      popular,
      revenue: !showRevenue ? null : {
        current: dashboardMetrics.monthlyRevenue || 0,
        previous: dashboardMetrics.previousMonthRevenue || 0,
        change: Math.round(revenueChange * 100) / 100 // Round to 2 decimal places
      },
      metrics: {
        completedOrdersThisMonth: dashboardMetrics.completedOrdersCount || 0,
        averageOrderValue: showRevenue ? Math.round((dashboardMetrics.averageOrderValue || 0) * 100) / 100 : null,
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