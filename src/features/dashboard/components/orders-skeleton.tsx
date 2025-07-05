"use client";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export function OrdersSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-neutral-200 rounded"></div>
          <div className="h-8 w-20 bg-neutral-200 rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                <div className="h-3 w-32 bg-neutral-200 rounded"></div>
                <div className="h-3 w-20 bg-neutral-200 rounded"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 w-16 bg-neutral-200 rounded ml-auto"></div>
                <div className="h-4 w-12 bg-neutral-200 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Stats Bar Skeleton
export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center p-4 bg-neutral-50 rounded-lg animate-pulse">
          <div className="h-8 w-12 bg-neutral-200 rounded mx-auto mb-2"></div>
          <div className="h-3 w-16 bg-neutral-200 rounded mx-auto"></div>
        </div>
      ))}
    </div>
  );
}

// Table Row Skeleton for larger order lists
export function OrderTableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-neutral-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-neutral-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-neutral-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-neutral-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-neutral-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-neutral-200 rounded"></div>
      </td>
    </tr>
  );
}

// Complete table skeleton
export function OrderTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden border border-neutral-200 rounded-lg">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3">
              <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse"></div>
            </th>
            <th className="px-6 py-3">
              <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse"></div>
            </th>
            <th className="px-6 py-3">
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>
            </th>
            <th className="px-6 py-3">
              <div className="h-4 w-18 bg-neutral-200 rounded animate-pulse"></div>
            </th>
            <th className="px-6 py-3">
              <div className="h-4 w-14 bg-neutral-200 rounded animate-pulse"></div>
            </th>
            <th className="px-6 py-3">
              <div className="h-4 w-12 bg-neutral-200 rounded animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {Array.from({ length: rows }).map((_, i) => (
            <OrderTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}