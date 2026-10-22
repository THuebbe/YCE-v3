import { Suspense } from 'react'
import { OrdersBoard } from '@/features/orders/components/orders-board'
import { OrdersBoardSkeleton } from '@/features/orders/components/orders-board-skeleton'
import { planOf } from '@/features/billing/entitlements'
import { requireAgencyPage } from '@/features/dashboard/access'
import { PageHeader } from '@/features/dashboard/components/page-header'

// Force dynamic rendering since we use server-side data fetching
export const dynamic = 'force-dynamic'

export default async function OrdersPage({ params }: { params: Promise<{ agency: string }> }) {
  const { agency: agencySlug } = await params
  const { agency } = await requireAgencyPage(agencySlug)

  return (
    <>
      <PageHeader title="Orders" description="Every booking, from new to picked up." />
      <Suspense fallback={<OrdersBoardSkeleton />}>
        <OrdersBoard agencySlug={agencySlug} plan={planOf(agency)} />
      </Suspense>
    </>
  )
}
