'use server';

import { cache } from 'react';
import { requireAgencyMember } from '@/features/auth/guards';
import { getAgencyPlan } from '@/features/billing/server';
import { hasFeature } from '@/features/billing/entitlements';
import { countOrderSigns } from '@/features/orders/client-utils';
import { getCurrentTenant } from '@/lib/tenant-context';
import { getDashboardMetrics as getSupabaseDashboardMetrics, getOrdersByAgency } from '@/lib/db/supabase-client';
import type { 
  DashboardMetrics, 
  RecentOrder, 
  RevenueComparison,
  DashboardDataParams,
  OrderStatus 
} from './types';

// Cache the dashboard metrics for 5 minutes
export const getDashboardMetrics = cache(async (agencyId: string): Promise<DashboardMetrics> => {
  if (!agencyId) {
    throw new Error('Agency ID is required');
  }
  await requireAgencyMember(agencyId);
  
  console.log('📊 Dashboard: Getting metrics for agency:', agencyId);

  try {
    // Use the Supabase implementation
    const [metrics, plan] = await Promise.all([getSupabaseDashboardMetrics(agencyId), getAgencyPlan(agencyId)]);
    // Revenue is Elite: don't send it to an Essentials agency's browser at all
    const revenueLocked = !hasFeature(plan, 'revenueMetrics');
    
    // Calculate additional metrics
    const monthlyRevenueChange = metrics.previousMonthRevenue > 0 
      ? ((metrics.monthlyRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue) * 100 
      : 0;

    console.log('📊 Dashboard: Metrics retrieved successfully');

    return {
      openOrders: metrics.openOrdersCount,
      revenueLocked,
      monthlyRevenue: revenueLocked ? 0 : metrics.monthlyRevenue,
      monthlyRevenueChange: revenueLocked ? 0 : monthlyRevenueChange,
      last30DaysRevenue: revenueLocked ? 0 : metrics.last30DaysRevenue || 0,
      completedOrdersThisMonth: metrics.completedOrdersCount,
      averageOrderValue: revenueLocked ? 0 : metrics.averageOrderValue,
    };

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
});

// Get recent orders with caching
export const getRecentOrders = cache(async (agencyId: string, params: { limit?: number } = {}): Promise<RecentOrder[]> => {
  if (!agencyId) {
    throw new Error('Agency ID is required');
  }
  await requireAgencyMember(agencyId);
  const { limit = 5 } = params;

  try {
    console.log('📊 Dashboard: Getting recent orders for agency:', agencyId);
    const orders = await getOrdersByAgency(agencyId, limit);

    return orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number || order.internal_number || 'N/A',
      customer_name: order.customer_name || 'Unknown',
      customer_email: order.customer_email || 'No email',
      event_date: order.event_date,
      status: order.status as OrderStatus,
      total: Number(order.total) || 0,
      signCount: countOrderSigns(order),
      created_at: order.created_at
    }));

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw new Error('Failed to fetch recent orders');
  }
});

// Force revalidation of dashboard cache
export async function revalidateDashboard(): Promise<void> {
  // This would integrate with Next.js revalidation if needed
  // For now, the cache will naturally expire based on the cache settings
}