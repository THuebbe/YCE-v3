'use server';

import { cache } from 'react';
import { getCurrentTenant } from '@/lib/tenant-context';
import { getDashboardMetrics as getSupabaseDashboardMetrics, getOrdersByAgency } from '@/lib/db/supabase-client';
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
  
  console.log('📊 Dashboard: Getting metrics for agency:', agencyId);

  try {
    // Use the Supabase implementation
    const metrics = await getSupabaseDashboardMetrics(agencyId);
    
    // Calculate additional metrics
    const monthlyRevenueChange = metrics.previousMonthRevenue > 0 
      ? ((metrics.monthlyRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue) * 100 
      : 0;

    console.log('📊 Dashboard: Metrics retrieved successfully');

    return {
      openOrders: metrics.openOrdersCount,
      monthlyRevenue: metrics.monthlyRevenue,
      monthlyRevenueChange,
      popularSigns: [], // TODO: Implement popular signs with Supabase
      upcomingDeployments: [], // TODO: Implement upcoming deployments with Supabase
      completedOrdersThisMonth: metrics.completedOrdersCount,
      averageOrderValue: metrics.averageOrderValue,
      pendingOrdersCount: 0, // TODO: Implement with Supabase
      processingOrdersCount: 0, // TODO: Implement with Supabase
      deployedOrdersCount: 0, // TODO: Implement with Supabase
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
  const signIds = popularSigns.map((item: typeof popularSigns[0]) => item.signId);
  const signs = await prisma.sign.findMany({
    where: { id: { in: signIds } },
    select: {
      id: true,
      name: true,
      category: true,
      imageUrl: true
    }
  });

  return popularSigns.map((item: typeof popularSigns[0]) => {
    const sign = signs.find((s: typeof signs[0]) => s.id === item.signId);
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

  return deployments.map((order: typeof deployments[0]) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    eventDate: order.eventDate,
    deliveryTime: order.deliveryTime,
    status: order.status as OrderStatus,
    signCount: order.orderItems.reduce((sum: number, item: typeof order.orderItems[0]) => sum + item.quantity, 0),
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
    console.log('📊 Dashboard: Getting recent orders for agency:', agencyId);
    const orders = await getOrdersByAgency(agencyId, limit);

    return orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber || order.internalNumber || 'N/A',
      customerName: order.customerName || 'Unknown',
      customerEmail: order.customerEmail || 'No email',
      eventDate: order.eventDate || order.deploymentDate,
      status: order.status as OrderStatus,
      total: Number(order.totalAmount || order.total || 0),
      signCount: 1, // TODO: Implement proper sign count with Supabase
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
    const signIds = popularSigns.map((item: typeof popularSigns[0]) => item.signId);
    const signs = await prisma.sign.findMany({
      where: { id: { in: signIds } },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true
      }
    });

    return popularSigns.map((item: typeof popularSigns[0]) => {
      const sign = signs.find((s: typeof signs[0]) => s.id === item.signId);
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