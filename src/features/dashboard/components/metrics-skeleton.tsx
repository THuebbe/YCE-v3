"use client";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export function MetricsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Open Orders Card Skeleton */}
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-neutral-200 rounded"></div>
          <div className="h-4 w-4 bg-neutral-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-neutral-200 rounded mb-2"></div>
          <div className="h-3 w-32 bg-neutral-200 rounded"></div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Card Skeleton */}
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-28 bg-neutral-200 rounded"></div>
          <div className="h-4 w-4 bg-neutral-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-neutral-200 rounded mb-2"></div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-neutral-200 rounded"></div>
            <div className="h-3 w-24 bg-neutral-200 rounded"></div>
          </div>
        </CardContent>
      </Card>

      {/* Average Order Value Card Skeleton */}
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
          <div className="h-4 w-4 bg-neutral-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-18 bg-neutral-200 rounded mb-2"></div>
          <div className="h-3 w-28 bg-neutral-200 rounded"></div>
        </CardContent>
      </Card>

      {/* Completed Orders Card Skeleton */}
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-36 bg-neutral-200 rounded"></div>
          <div className="h-4 w-4 bg-neutral-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-14 bg-neutral-200 rounded mb-2"></div>
          <div className="h-3 w-20 bg-neutral-200 rounded"></div>
        </CardContent>
      </Card>
    </div>
  );
}

// Popular Signs Skeleton
export function PopularSignsSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-neutral-200 rounded"></div>
          <div className="h-8 w-24 bg-neutral-200 rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-neutral-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                <div className="h-3 w-16 bg-neutral-200 rounded"></div>
              </div>
              <div className="h-4 w-12 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Upcoming Deployments Skeleton
export function UpcomingDeploymentsSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 bg-neutral-200 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-neutral-200 rounded"></div>
                <div className="h-3 w-24 bg-neutral-200 rounded"></div>
                <div className="h-3 w-20 bg-neutral-200 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}