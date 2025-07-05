import { Suspense } from 'react';
import { Container } from '@/shared/components/layout/container';
import { OrdersBoard } from '@/features/orders/components/orders-board';
import { OrdersBoardSkeleton } from '@/features/orders/components/orders-board-skeleton';

export const metadata = {
  title: 'Orders - YardCard Elite',
  description: 'Manage your yard sign orders'
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="full" spacing="wide">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="mt-2 text-gray-600">
              Manage your yard sign orders from booking to completion
            </p>
          </div>
          
          <Suspense fallback={<OrdersBoardSkeleton />}>
            <OrdersBoard />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}