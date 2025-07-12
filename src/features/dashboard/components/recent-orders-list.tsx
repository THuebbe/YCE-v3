"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Calendar, User, Package } from "@/shared/components/ui/icons";
import type { RecentOrdersListProps, OrderStatus } from "../types";

export function RecentOrdersList({ 
  orders, 
  loading = false, 
  error = null, 
  limit = 5 
}: RecentOrdersListProps) {
  const params = useParams();
  const agencySlug = params.agency as string;
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-error">
        <CardHeader>
          <CardTitle className="text-error">Error Loading Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-small text-neutral-600 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          {orders.length > 0 && agencySlug && (
            <Link href={`/${agencySlug}/orders`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {orders.slice(0, limit).map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderItem({ order }: { order: any }) {
  const params = useParams();
  const agencySlug = params.agency as string;
  
  return (
    <Link href={agencySlug ? `/${agencySlug}/orders/${order.id}` : '/routing'} className="block">
      <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-neutral-500" />
          <span className="font-medium text-neutral-900">{order.customerName}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center space-x-4 text-body-small text-neutral-600">
          <div className="flex items-center space-x-1">
            <span>#{order.orderNumber}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span>{order.signCount} signs</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(order.eventDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-neutral-900">
          ${order.total.toLocaleString()}
        </div>
        <div className="text-body-small text-neutral-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' };
      case 'processing':
        return { bg: 'bg-info/10', text: 'text-info', label: 'Processing' };
      case 'deployed':
        return { bg: 'bg-accent-blue/10', text: 'text-accent-blue', label: 'Deployed' };
      case 'completed':
        return { bg: 'bg-success/10', text: 'text-success', label: 'Completed' };
      case 'cancelled':
        return { bg: 'bg-error/10', text: 'text-error', label: 'Cancelled' };
      default:
        return { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
        No recent orders
      </h3>
      <p className="text-body text-neutral-600 mb-6">
        Share your booking link to get your first orders!
      </p>
      <div className="space-y-2">
        <Button>Share Booking Link</Button>
        <Button variant="ghost">View Sample Order</Button>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-neutral-200 rounded"></div>
        <div className="h-3 w-48 bg-neutral-200 rounded"></div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 w-16 bg-neutral-200 rounded ml-auto"></div>
        <div className="h-3 w-12 bg-neutral-200 rounded ml-auto"></div>
      </div>
    </div>
  );
}