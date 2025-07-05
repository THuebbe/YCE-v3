import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MobileCheckIn } from '@/features/orders/components/mobile-check-in';
import { MobileCheckInSkeleton } from '@/features/orders/components/mobile-check-in-skeleton';
import { requireOrderWithDetails } from '@/features/orders/utils';

interface CheckInPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: CheckInPageProps) {
  try {
    const { orderId } = await params;
    const order = await requireOrderWithDetails(orderId);
    return {
      title: `Check In Signs - Order #${order.orderNumber}`,
      description: `Mobile check-in interface for ${order.customerName}'s order`,
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    };
  } catch {
    return {
      title: 'Order Not Found - YardCard Elite'
    };
  }
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  // Await params to fix Next.js 15 requirement
  const { orderId } = await params;
  
  let order;
  
  try {
    order = await requireOrderWithDetails(orderId);
  } catch {
    notFound();
  }

  // Only allow check-in for deployed orders
  if (order.status !== 'deployed') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<MobileCheckInSkeleton />}>
        <MobileCheckIn order={order} />
      </Suspense>
    </div>
  );
}