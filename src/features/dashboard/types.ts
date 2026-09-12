// Dashboard Types and Interfaces
import React from 'react';

export interface DashboardMetrics {
  openOrders: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number; // Percentage change from previous month
  last30DaysRevenue: number; // Rolling 30-day revenue
  popularSigns: PopularSign[];
  upcomingDeployments: UpcomingDeployment[];
  completedOrdersThisMonth: number;
  averageOrderValue: number;
  pendingOrdersCount: number;
  processingOrdersCount: number;
  deployedOrdersCount: number;
}

export interface PopularSign {
  id: string;
  name: string;
  category: string;
  image_url: string;
  totalOrdered: number;
  revenue: number;
  isMySign?: boolean; // Differentiates between agency's signs vs platform-wide
}

export interface UpcomingDeployment {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  event_date: Date;
  delivery_time: string | null;
  status: OrderStatus;
  signCount: number;
  address: string;
  total: number;
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

// Popular signs comparison data
export interface PopularSignsData {
  myAgency: PopularSign[];
  platformWide: PopularSign[];
  selectedView: 'agency' | 'platform';
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