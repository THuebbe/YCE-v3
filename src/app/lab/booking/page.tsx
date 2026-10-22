import type { Metadata } from 'next'
import { parseBranding } from '@/features/agency/branding'
import { DemoBooking } from './DemoBooking'

export const metadata: Metadata = { title: 'Booking - lab' }

/**
 * The booking wizard with a demo agency and stand-in server calls, for
 * design work on every step without a database (preview and dev only, via
 * the lab layout). Try white label with ?brand=6B2D8C&accent=FFB703.
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
  return <DemoBooking branding={branding} />
}
