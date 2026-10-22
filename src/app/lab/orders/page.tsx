import type { Metadata } from 'next'
import { OrdersViewList } from '@/features/orders/components/orders-view'
import { EmptyOrdersState } from '@/features/orders/components/empty-orders-state'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { parseView } from '@/features/orders/views'
import { LabShell } from '../lab-shell'
import { demoOrders } from './demo-orders'

export const metadata: Metadata = { title: 'Orders - lab' }

/**
 * The orders list with demo orders (preview and dev only). Buttons that
 * change an order call the real server actions, which refuse here.
 *   ?view=out|done|cancelled  the filter chips
 *   ?plan=essentials          no pick ticket step
 *   ?empty=1                  no orders at all
 */
export default async function OrdersLabPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  return (
    <LabShell>
      <PageHeader title="Orders" />
      {q.empty
        ? <EmptyOrdersState agencySlug="lab" />
        : <OrdersViewList orders={demoOrders()} view={parseView(q.view)} slug="lab" plan={q.plan === 'essentials' ? 'essentials' : 'elite'} />}
    </LabShell>
  )
}
