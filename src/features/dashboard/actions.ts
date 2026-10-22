'use server';

import { cache } from 'react';
import { requireAgencyMember } from '@/features/auth/guards';
import { getAgencyPlan } from '@/features/billing/server';
import { hasFeature } from '@/features/billing/entitlements';
import { getDashboardMetrics as getSupabaseDashboardMetrics } from '@/lib/db/supabase-client';
import type { DashboardMetrics } from './types';

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
