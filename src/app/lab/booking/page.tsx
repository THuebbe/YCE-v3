import type { Metadata } from 'next'
import { parseBranding } from '@/features/agency/branding'
import { DemoBooking } from './DemoBooking'

export const metadata: Metadata = { title: 'Booking - lab' }

/**
 * The booking wizard with a demo agency and stand-in server calls, for
 * design work on every step without a database (preview and dev only, via
 * the lab layout). Try white label with ?brand=6B2D8C&accent=FFB703.
 * Stock: ?stock=2 (units of each sign, default 20), ?busy=1 (most letters
 * booked for the weekend two weeks out, so those days go gray).
 * Payment needs the real payment-methods API, so that step shows its
 * error state here.
 */
export default async function BookingLabPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  const branding = parseBranding({
    brandColor: q.brand && `#${q.brand}`,
    accentColor: q.accent && `#${q.accent}`,
    logoUrl: q.logo,
  })
  const perSign = Math.min(50, Math.max(0, Number(q.stock ?? 20) || 0))
  return <DemoBooking branding={branding} stock={{ perSign, busy: q.busy === '1' }} />
}
