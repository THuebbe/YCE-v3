'use client'

import { BookingWizard } from '@/features/booking/components/booking-wizard'
import type { BookingActions } from '@/features/booking/context/wizard-context'
import { DEFAULT_POLICIES } from '@/features/booking/policies'
import { DEFAULT_BOOKING_RULES } from '@/features/booking/booking-rules'
import type { AgencyBranding } from '@/features/agency/branding'
import { toDayKey } from '@/features/booking/booking-rules'
import { demoSnapshot } from './demo-stock'

const DAY_MS = 24 * 60 * 60 * 1000

/** Stand-ins for the server: every step renders, nothing touches the database */
const demoActions = (stock: { perSign: number; busy: boolean }): BookingActions => ({
  getBookingCatalog: async () => ({
    styles: ['classic'],
    colorways: ['red', 'blue', 'pink', 'gold', 'green', 'purple', 'black'],
  }),
  createBookingHold: async input => {
    const event = new Date(input.eventDate).getTime()
    return {
      ok: true,
      holdId: `demo-hold-${Date.now()}`,
      rentalStart: new Date(event - (1 + input.extraDaysBefore) * DAY_MS).toISOString(),
      rentalEnd: new Date(event + (1 + input.extraDaysAfter) * DAY_MS).toISOString(),
    }
  },
  touchBookingHold: async () => ({ ok: true }),
  saveDisplaySnapshot: async () => ({ ok: true, url: '' }),
  getAvailabilitySnapshot: async () => ({ ok: true, snapshot: demoSnapshot({ ...stock, today: toDayKey(new Date()) }) }),
})

export function DemoBooking({ branding, stock = { perSign: 20, busy: false } }: { branding: AgencyBranding; stock?: { perSign: number; busy: boolean } }) {
  return (
    <BookingWizard
      agencyId="demo-agency"
      agencySlug="lab-demo"
      agency={{ name: 'Lucky Lawn Signs', email: 'hello@example.com', phone: '(555) 010-0199' }}
      branding={branding}
      pricing={{ basePrice: 95, extraDayPrice: 15, lateFee: DEFAULT_POLICIES.lateFee }}
      policies={DEFAULT_POLICIES}
      bookingRules={DEFAULT_BOOKING_RULES}
      actions={demoActions(stock)}
    />
  )
}
