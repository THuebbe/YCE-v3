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
export const getDashboardMetrics = cache(async (agencyId: string): Promise<DashboardMetrics> => {
  if (!agencyId) {
    throw new Error('Agency ID is required');
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

// Get popular signs with order data (TODO: Implement with Supabase)
async function getPopularSigns(agencyId: string): Promise<PopularSign[]> {
  // Temporarily return empty array until we implement Supabase queries
  console.log('📊 Dashboard: Popular signs not yet implemented with Supabase for agency:', agencyId);
  return [];
}

// Get upcoming deployments (TODO: Implement with Supabase)
async function getUpcomingDeployments(agencyId: string, endDate: Date): Promise<UpcomingDeployment[]> {
  // Temporarily return empty array until we implement Supabase queries
  console.log('📊 Dashboard: Upcoming deployments not yet implemented with Supabase for agency:', agencyId);
  return [];
}

// Get recent orders with caching
export const getRecentOrders = cache(async (agencyId: string, params: { limit?: number } = {}): Promise<RecentOrder[]> => {
  if (!agencyId) {
    throw new Error('Agency ID is required');
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

// Get platform-wide popular signs for comparison (TODO: Implement with Supabase)
export const getPlatformPopularSigns = cache(async (): Promise<PopularSign[]> => {
  console.log('📊 Dashboard: Platform popular signs not yet implemented with Supabase');
  return [];
});

// Force revalidation of dashboard cache
export async function revalidateDashboard(): Promise<void> {
  // This would integrate with Next.js revalidation if needed
  // For now, the cache will naturally expire based on the cache settings
}