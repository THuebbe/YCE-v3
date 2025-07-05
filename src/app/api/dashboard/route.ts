import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDashboardMetrics, getRecentOrders, getPlatformPopularSigns } from '@/features/dashboard/actions'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use our new server actions to fetch real data
    const [metrics, recentOrders, platformSigns] = await Promise.all([
      getDashboardMetrics(),
      getRecentOrders({ limit: 5 }),
      getPlatformPopularSigns()
    ]);

    // Transform to match existing component expectations
    const dashboardData = {
      openOrders: metrics.openOrders,
      upcomingOrders: metrics.upcomingDeployments.map(deployment => ({
        id: deployment.id,
        customerName: deployment.customerName,
        eventDate: deployment.eventDate.toISOString(),
        status: deployment.status,
        signCount: deployment.signCount
      })),
      popularSigns: metrics.popularSigns.map(sign => ({
        name: sign.name,
        count: sign.totalOrdered
      })),
      revenue: {
        current: metrics.monthlyRevenue,
        previous: metrics.monthlyRevenue - (metrics.monthlyRevenue * (metrics.monthlyRevenueChange / 100)),
        change: metrics.monthlyRevenueChange
      },
      recentOrders: recentOrders,
      platformPopularSigns: platformSigns,
      metrics: {
        completedOrdersThisMonth: metrics.completedOrdersThisMonth,
        averageOrderValue: metrics.averageOrderValue,
        pendingOrders: metrics.pendingOrdersCount,
        processingOrders: metrics.processingOrdersCount,
        deployedOrders: metrics.deployedOrdersCount
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