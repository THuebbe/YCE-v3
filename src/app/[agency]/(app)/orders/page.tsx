import { Suspense } from 'react'
import { OrdersBoard } from '@/features/orders/components/orders-board'
import { OrdersBoardSkeleton } from '@/features/orders/components/orders-board-skeleton'
import { parseView } from '@/features/orders/views'
import { planOf } from '@/features/billing/entitlements'
import { requireAgencyPage } from '@/features/dashboard/access'
import { PageHeader } from '@/features/dashboard/components/page-header'

// Force dynamic rendering since we use server-side data fetching
export const dynamic = 'force-dynamic'

export default async function OrdersPage({ params, searchParams }: {
  params: Promise<{ agency: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { agency: agencySlug } = await params
  const view = parseView((await searchParams).view)
  const { agency } = await requireAgencyPage(agencySlug)

  return (
    <>
      <PageHeader title="Orders" />
      <Suspense key={view} fallback={<OrdersBoardSkeleton />}>
        <OrdersBoard agencySlug={agencySlug} plan={planOf(agency)} view={view} />
      </Suspense>
    </>
  )
}
