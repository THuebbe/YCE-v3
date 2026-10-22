import { notFound } from 'next/navigation'
import { OrderDetails } from '@/features/orders/components/order-details'
import { LabShell } from '../../lab-shell'
import { demoOrders } from '../demo-orders'

/** One demo order (preview and dev only). ?plan=essentials locks the Elite documents. */
export default async function OrderLabPage({ params, searchParams }: {
  params: Promise<{ orderId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { orderId } = await params
  const q = await searchParams
  const order = demoOrders().find(o => o.id === orderId)
  if (!order) notFound()
  return (
    <LabShell>
      <OrderDetails order={order} slug="lab" plan={q.plan === 'essentials' ? 'essentials' : 'elite'} />
    </LabShell>
  )
}
