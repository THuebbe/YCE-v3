import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { OrderDetails } from '@/features/orders/components/order-details'
import { OrderDetailsSkeleton } from '@/features/orders/components/order-details-skeleton'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
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

async function OrderDetailsData({ orderId, plan }: { orderId: string; plan: Plan }) {
  try {
    const order = await getOrderWithDetails(orderId)
    
    if (!order) {
      notFound()
    }

    // Checked in: the late/damage fees the agency may charge
    const feeQuote = order.status === 'completed' ? await getFeeQuote(order.id, order.agency_id) : null
    return <OrderDetails order={order} plan={plan} feeQuote={feeQuote} />
  } catch (error) {
    console.error('Error fetching order details:', error)
    notFound()
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { userId } = await auth()
  const { agency: agencySlug, orderId } = await params
  
  console.log('📋 Order Details: Loading order', orderId, 'for agency:', agencySlug)
  
  if (!userId) {
    console.log('📋 Order Details: No user ID, redirecting to sign-in')
    redirect('/auth/sign-in')
  }

  // Verify the agency exists and the user has access to it
  let agency, user
  try {
    const results = await Promise.all([
      getAgencyBySlug(agencySlug),
      getUserById(userId)
    ])
    agency = results[0]
    user = results[1]

    if (!agency) {
      console.log('📋 Order Details: Agency not found:', agencySlug)
      redirect('/routing')
    }

    if (!user || user.agency?.slug !== agencySlug) {
      console.log('📋 Order Details: User does not have access to agency:', agencySlug)
      redirect('/routing')
    }

    console.log('📋 Order Details: Access verified for agency:', agencySlug, 'user:', user.id)
  } catch (error) {
    console.error('📋 Order Details: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Order Details with Suspense */}
        <Suspense fallback={<OrderDetailsSkeleton />}>
          <OrderDetailsData orderId={orderId} plan={planOf(agency)} />
        </Suspense>
      </main>
    </div>
  )
}