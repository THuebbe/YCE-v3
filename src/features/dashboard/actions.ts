'use server';

import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentTenant } from '@/lib/tenant-context';
import type { 
  DashboardMetrics, 
  RecentOrder, 
  PopularSign, 
  UpcomingDeployment,
  RevenueComparison,
  DashboardDataParams,
  OrderStatus 
} from './types';

// Cache the dashboard metrics for 5 minutes
export const getDashboardMetrics = cache(async (): Promise<DashboardMetrics> => {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }
  
  // Get current date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // Concurrent data fetching for optimal performance
    const [
      openOrders,
      pendingOrders,
      processingOrders,
      deployedOrders,
      currentMonthRevenue,
      previousMonthRevenue,
      completedOrdersThisMonth,
      popularSigns,
      upcomingDeployments,
      totalOrdersThisMonth
    ] = await Promise.all([
      // Open orders count (pending, processing, deployed)
      prisma.order.count({
        where: {
          agencyId,
          status: { in: ['pending', 'processing', 'deployed'] }
        }
      }),

      // Individual status counts
      prisma.order.count({
        where: { agencyId, status: 'pending' }
      }),
      
      prisma.order.count({
        where: { agencyId, status: 'processing' }
      }),
      
      prisma.order.count({
        where: { agencyId, status: 'deployed' }
      }),

      // Current month revenue
      prisma.order.aggregate({
        where: {
          agencyId,
          status: 'completed',
          createdAt: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),

      // Previous month revenue for comparison
      prisma.order.aggregate({
        where: {
          agencyId,
          status: 'completed',
          createdAt: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          }
        },
        _sum: { total: true }
      }),

      // Completed orders this month
      prisma.order.count({
        where: {
          agencyId,
          status: 'completed',
          createdAt: { gte: startOfMonth }
        }
      }),

      // Popular signs (top 5 by quantity in last 30 days)
      getPopularSigns(agencyId),

      // Upcoming deployments (next 7 days)
      getUpcomingDeployments(agencyId, next7Days),

      // Total orders this month for average calculation
      prisma.order.count({
        where: {
          agencyId,
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    // Calculate metrics
    const currentRevenue = Number(currentMonthRevenue._sum.total) || 0;
    const previousRevenue = Number(previousMonthRevenue._sum.total) || 0;
    const monthlyRevenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const averageOrderValue = totalOrdersThisMonth > 0 
      ? currentRevenue / totalOrdersThisMonth 
      : 0;

    return {
      openOrders,
      monthlyRevenue: currentRevenue,
      monthlyRevenueChange,
      popularSigns,
      upcomingDeployments,
      completedOrdersThisMonth,
      averageOrderValue,
      pendingOrdersCount: pendingOrders,
      processingOrdersCount: processingOrders,
      deployedOrdersCount: deployedOrders,
    };

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
});

// Get popular signs with order data
async function getPopularSigns(agencyId: string): Promise<PopularSign[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const popularSigns = await prisma.orderItem.groupBy({
    by: ['signId'],
    where: {
      order: {
        agencyId,
        createdAt: { gte: thirtyDaysAgo }
      }
    },
    _sum: {
      quantity: true,
      lineTotal: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5
  });

  // Get sign details
  const signIds = popularSigns.map(item => item.signId);
  const signs = await prisma.sign.findMany({
    where: { id: { in: signIds } },
    select: {
      id: true,
      name: true,
      category: true,
      imageUrl: true
    }
  });

  return popularSigns.map(item => {
    const sign = signs.find(s => s.id === item.signId);
    return {
      id: item.signId,
      name: sign?.name || 'Unknown Sign',
      category: sign?.category || 'General',
      imageUrl: sign?.imageUrl || '/images/sign-placeholder.png',
      totalOrdered: item._sum.quantity || 0,
      revenue: Number(item._sum.lineTotal) || 0,
      isMySign: true // Since this is agency-specific data
    };
  });
}

// Get upcoming deployments
async function getUpcomingDeployments(agencyId: string, endDate: Date): Promise<UpcomingDeployment[]> {
  const deployments = await prisma.order.findMany({
    where: {
      agencyId,
      eventDate: {
        gte: new Date(),
        lte: endDate
      },
      status: { in: ['pending', 'processing', 'deployed'] }
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      eventDate: true,
      deliveryTime: true,
      status: true,
      total: true,
      eventAddress: true,
      orderItems: {
        select: {
          quantity: true
        }
      }
    },
    orderBy: {
      eventDate: 'asc'
    },
    take: 10
  });

  return deployments.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    eventDate: order.eventDate,
    deliveryTime: order.deliveryTime,
    status: order.status as OrderStatus,
    signCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    address: order.eventAddress || 'Address not available',
    total: Number(order.total)
  }));
}

// Get recent orders with caching
export const getRecentOrders = cache(async (params: { limit?: number } = {}): Promise<RecentOrder[]> => {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }
  const { limit = 5 } = params;

  try {
    const orders = await prisma.order.findMany({
      where: { agencyId },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        eventDate: true,
        status: true,
        total: true,
        createdAt: true,
        orderItems: {
          select: {
            quantity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      eventDate: order.eventDate,
      status: order.status as OrderStatus,
      total: Number(order.total),
      signCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt
    }));

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw new Error('Failed to fetch recent orders');
  }
});

// Get platform-wide popular signs for comparison
export const getPlatformPopularSigns = cache(async (): Promise<PopularSign[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const popularSigns = await prisma.orderItem.groupBy({
      by: ['signId'],
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      _sum: {
        quantity: true,
        lineTotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Get sign details
    const signIds = popularSigns.map(item => item.signId);
    const signs = await prisma.sign.findMany({
      where: { id: { in: signIds } },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true
      }
    });

    return popularSigns.map(item => {
      const sign = signs.find(s => s.id === item.signId);
      return {
        id: item.signId,
        name: sign?.name || 'Unknown Sign',
        category: sign?.category || 'General',
        imageUrl: sign?.imageUrl || '/images/sign-placeholder.png',
        totalOrdered: item._sum.quantity || 0,
        revenue: Number(item._sum.lineTotal) || 0,
        isMySign: false // Platform-wide data
      };
    });

  } catch (error) {
    console.error('Error fetching platform popular signs:', error);
    return [];
  }
});

// Force revalidation of dashboard cache
export async function revalidateDashboard(): Promise<void> {
  // This would integrate with Next.js revalidation if needed
  // For now, the cache will naturally expire based on the cache settings
}