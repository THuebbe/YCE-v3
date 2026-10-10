import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { MobileCheckIn } from '@/features/orders/components/mobile-check-in'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { getOrderWithDetails } from '@/features/orders/utils'

export const dynamic = 'force-dynamic'

interface CheckInPageProps {
  params: Promise<{ agency: string; orderId: string }>
}

/** Pickup check-in for a deployed order (phone-first layout). */
export default async function OrderCheckInPage({ params }: CheckInPageProps) {
  const { userId } = await auth()
  const { agency: agencySlug, orderId } = await params
  if (!userId) redirect('/auth/sign-in')

  const [agency, user] = await Promise.all([getAgencyBySlug(agencySlug), getUserById(userId)])
  if (!agency || !user || user.agency?.slug !== agencySlug) redirect('/routing')

  const order = await getOrderWithDetails(orderId).catch(() => null)
  // Same agency as the URL and the signed-in member (RLS is off)
  if (!order || order.agency_id !== agency.id) notFound()

  return <MobileCheckIn order={order} />
}
