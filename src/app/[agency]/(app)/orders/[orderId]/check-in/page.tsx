import { notFound } from 'next/navigation'
import { MobileCheckIn } from '@/features/orders/components/mobile-check-in'
import { requireAgencyPage } from '@/features/dashboard/access'
import { getOrderWithDetails } from '@/features/orders/utils'

export const dynamic = 'force-dynamic'

interface CheckInPageProps {
  params: Promise<{ agency: string; orderId: string }>
}

/** Pickup check-in for a deployed order (phone-first layout). */
export default async function OrderCheckInPage({ params }: CheckInPageProps) {
  const { agency: agencySlug, orderId } = await params
  const { agency } = await requireAgencyPage(agencySlug)

  const order = await getOrderWithDetails(orderId).catch(() => null)
  // Same agency as the URL and the signed-in member (RLS is off)
  if (!order || order.agency_id !== agency.id) notFound()

  return <MobileCheckIn order={order} />
}
