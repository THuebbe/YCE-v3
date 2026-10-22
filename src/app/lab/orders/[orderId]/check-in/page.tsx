import { notFound } from 'next/navigation'
import { MobileCheckIn } from '@/features/orders/components/mobile-check-in'
import { LabShell } from '../../../lab-shell'
import { demoOrders } from '../../demo-orders'

/** Check-in for a demo order (preview and dev only); demo-3 is the one that's out */
export default async function CheckInLabPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const order = demoOrders().find(o => o.id === orderId)
  if (!order) notFound()
  return (
    <LabShell>
      <MobileCheckIn order={order} slug="lab" />
    </LabShell>
  )
}
