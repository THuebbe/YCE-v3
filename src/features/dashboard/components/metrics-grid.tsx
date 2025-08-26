"use client";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { TrendingUp, TrendingDown, Package, Calendar, DollarSign, Wallet, CheckCircle } from "@/shared/components/ui/icons";
import type { DashboardMetrics, MetricsGridProps } from "../types";

export function MetricsGrid({ metrics, loading = false, error = null }: MetricsGridProps) {
  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-error">
            <CardContent className="flex items-center justify-center h-24">
              <p className="text-error text-sm">Failed to load</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getOrderColorScheme = (count: number) => {
    if (count <= 5) return { color: 'text-success', bg: 'bg-success/10' };
    if (count <= 10) return { color: 'text-warning', bg: 'bg-warning/10' };
    return { color: 'text-error', bg: 'bg-error/10' };
  };

  const orderColors = getOrderColorScheme(metrics.openOrders);
  const revenueChange = metrics.monthlyRevenueChange;
  const isRevenuePositive = revenueChange >= 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Open Orders */}
      <MetricCard
        title="Open Orders"
        value={metrics.openOrders}
        icon={<Package className="h-5 w-5" />}
        description="Active customer orders"
        colorScheme={orderColors}
        loading={loading}
      />

      {/* Monthly Revenue */}
      <MetricCard
        title="Monthly Revenue"
        value={`$${metrics.monthlyRevenue.toLocaleString()}`}
        icon={<Wallet className="h-5 w-5" />}
        description="Current month revenue"
        trend={{
          value: Math.abs(revenueChange),
          isPositive: isRevenuePositive,
          icon: isRevenuePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
        }}
        colorScheme={{ color: 'text-success', bg: 'bg-success/10' }}
        loading={loading}
      />

      {/* Last 30 Days Revenue */}
      <MetricCard
        title="Last 30 Days"
        value={`$${metrics.last30DaysRevenue.toLocaleString()}`}
        icon={<DollarSign className="h-5 w-5" />}
        description="Rolling 30-day revenue"
        colorScheme={{ color: 'text-success', bg: 'bg-success/10' }}
        loading={loading}
      />

      {/* Completed Orders */}
      <MetricCard
        title="Completed This Month"
        value={metrics.completedOrdersThisMonth}
        icon={<CheckCircle className="h-5 w-5" />}
        description="Fulfilled orders"
        colorScheme={{ color: 'text-success', bg: 'bg-success/10' }}
        loading={loading}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    icon: React.ReactNode;
  };
  colorScheme: {
    color: string;
    bg: string;
  };
  loading?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  colorScheme,
  loading = false 
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-neutral-200 rounded"></div>
          <div className="h-5 w-5 bg-neutral-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-neutral-200 rounded mb-2"></div>
          <div className="h-3 w-32 bg-neutral-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-label text-neutral-600 font-medium">
          {title}
        </p>
        <div className={`p-2 rounded-lg ${colorScheme.bg}`}>
          <span className={colorScheme.color}>
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold text-neutral-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {trend && (
              <div className={`flex items-center text-sm font-medium ${
                trend.isPositive ? 'text-success' : 'text-error'
              }`}>
                {trend.icon}
                <span className="ml-1">{trend.value.toFixed(1)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-body-small text-neutral-600">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}