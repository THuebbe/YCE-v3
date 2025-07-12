'use client';

import { OrderStatus, getStatusColor } from '../stateMachine';
import { OrderCard } from './order-card';
import { Badge } from '@/shared/components/ui/badge';

interface OrderColumnProps {
  status: OrderStatus;
  title: string;
  description: string;
  orders: any[];
}

export function OrderColumn({ status, title, description, orders }: OrderColumnProps) {
  const statusColor = getStatusColor(status);

  return (
    <div className="bg-background-white rounded-xl shadow-default border border-neutral-200 overflow-hidden">
      {/* Column Header */}
      <div className="p-medium border-b border-neutral-200 bg-background-light">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h5 text-neutral-700">{title}</h3>
            <p className="text-body-small text-neutral-600 mt-1">{description}</p>
          </div>
          <Badge variant="secondary" className={`${statusColor} font-medium`}>
            {orders.length}
          </Badge>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-medium space-y-small max-h-[800px] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-body-small">No {title.toLowerCase()} orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}