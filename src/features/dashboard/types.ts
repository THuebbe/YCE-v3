// Dashboard types

export interface DashboardMetrics {
  openOrders: number;
  revenueLocked: boolean; // Essentials: revenue fields are zeroed, tiles show "Elite"
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
