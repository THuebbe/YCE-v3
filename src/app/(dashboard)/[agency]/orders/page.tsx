import { Suspense } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { Container } from '@/shared/components/layout/container';
import { OrdersBoard } from '@/features/orders/components/orders-board';
import { OrdersBoardSkeleton } from '@/features/orders/components/orders-board-skeleton';

interface OrdersPageProps {
  params: Promise<{
    agency: string;
  }>;
}

export const metadata = {
  title: 'Orders - YardCard Elite',
  description: 'Manage your yard sign orders'
};

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { agency } = await params;
  
  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <Container size="full" spacing="wide">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-h1 text-neutral-900 tracking-tight">Orders</h1>
            <p className="mt-3 text-lg text-neutral-600">
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