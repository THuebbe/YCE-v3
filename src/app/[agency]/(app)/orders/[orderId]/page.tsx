import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { requireAgencyPage } from '@/features/dashboard/access'
import { OrderDetails } from '@/features/orders/components/order-details'
import { OrderDetailsSkeleton } from '@/features/orders/components/order-details-skeleton'
import { getOrderWithDetails } from '@/features/orders/utils'
import { getFeeQuote } from '@/features/orders/fees'
import { planOf, type Plan } from '@/features/billing/entitlements'

// Force dynamic rendering since we use server-side data fetching
export const dynamic = 'force-dynamic'

interface OrderDetailPageProps {
  params: Promise<{
    agency: string;
    orderId: string;
  }>;
}

async function OrderDetailsData({ orderId, plan, slug }: { orderId: string; plan: Plan; slug: string }) {
  try {
    const order = await getOrderWithDetails(orderId)
    
    if (!order) {
      notFound()
    }

    // Checked in: the late/damage fees the agency may charge
    const feeQuote = order.status === 'completed' ? await getFeeQuote(order.id, order.agency_id) : null
    return <OrderDetails order={order} plan={plan} slug={slug} feeQuote={feeQuote} />
  } catch (error) {
    console.error('Error fetching order details:', error)
    notFound()
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { agency: agencySlug, orderId } = await params
  const { agency } = await requireAgencyPage(agencySlug)

  return (
    <Suspense fallback={<OrderDetailsSkeleton />}>
      <OrderDetailsData orderId={orderId} plan={planOf(agency)} slug={agencySlug} />
    </Suspense>
  )
}
