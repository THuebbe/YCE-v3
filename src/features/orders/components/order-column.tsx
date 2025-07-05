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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <Badge variant="secondary" className={`${statusColor} font-medium`}>
            {orders.length}
          </Badge>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3 max-h-[800px] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No {title.toLowerCase()} orders</p>
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