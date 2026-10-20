// Dashboard Types and Interfaces
import React from 'react';

export interface DashboardMetrics {
  openOrders: number;
  revenueLocked: boolean; // Essentials: revenue fields are zeroed, cards show "Elite"
  monthlyRevenue: number;
  monthlyRevenueChange: number; // Percentage change from previous month
  last30DaysRevenue: number; // Rolling 30-day revenue
  completedOrdersThisMonth: number;
  averageOrderValue: number;
}

/** Elite dashboard card (features/dashboard/popular-displays.ts) */
export interface PopularItem {
  name: string;
  count: number;
}

export interface PopularDisplays {
  occasions: PopularItem[];
  themes: PopularItem[];
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  event_date: Date;
  status: OrderStatus;
  total: number;
  signCount: number;
  created_at: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'deployed' | 'completed' | 'cancelled';

export interface DashboardFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  signCategory?: string;
  orderStatus?: OrderStatus[];
}

// Metric card types for UI components
export interface MetricCardData {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  loading?: boolean;
  error?: string;
}

// Revenue comparison data
export interface RevenueComparison {
  current: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

// Loading and error states
export interface DashboardState {
  metrics: DashboardMetrics | null;
  recentOrders: RecentOrder[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Dashboard component props
export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface MetricsGridProps {
  metrics: DashboardMetrics;
  loading?: boolean;
  error?: string | null;
}

export interface RecentOrdersListProps {
  orders: RecentOrder[];
  loading?: boolean;
  error?: string | null;
  limit?: number;
}

// Cache and data fetching
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  revalidate?: boolean;
}

export interface DashboardDataParams {
  agencyId: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  cache?: CacheConfig;
}