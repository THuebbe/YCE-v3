"use client";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

interface MetricsSkeletonProps {
  cards?: number;
  layout?: 'grid' | 'row';
  showChart?: boolean;
}

export function MetricsSkeleton({ 
  cards = 4, 
  layout = 'grid',
  showChart = false 
}: MetricsSkeletonProps) {
  const gridClass = layout === 'grid' 
    ? `grid gap-6 md:grid-cols-2 lg:grid-cols-${Math.min(cards, 4)}`
    : 'flex gap-6 overflow-x-auto';

  return (
    <div className={gridClass}>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="animate-pulse min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-neutral-200 rounded"></div>
            <div className="h-4 w-4 bg-neutral-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-8 w-16 bg-neutral-200 rounded"></div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-neutral-200 rounded"></div>
                <div className="h-3 w-20 bg-neutral-200 rounded"></div>
              </div>
              {showChart && (
                <div className="h-16 w-full bg-neutral-200 rounded mt-4"></div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Compact metric skeleton for smaller spaces
export function CompactMetricSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg animate-pulse">
      <div className="h-8 w-8 bg-neutral-200 rounded"></div>
      <div className="flex-1 space-y-1">
        <div className="h-4 w-16 bg-neutral-200 rounded"></div>
        <div className="h-3 w-12 bg-neutral-200 rounded"></div>
      </div>
      <div className="h-6 w-12 bg-neutral-200 rounded"></div>
    </div>
  );
}

// List of compact metrics
export function CompactMetricsListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <CompactMetricSkeleton key={i} />
      ))}
    </div>
  );
}