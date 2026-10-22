import { getAgencyBySlug } from '@/lib/db/supabase-client'
import { loadCancelQuote } from '@/features/orders/customer-cancel'
import { formatDay } from '@/features/booking/booking-rules'
import { activeBranding } from '@/features/agency/branding'
import { BookingFrame } from '@/features/booking/components/booking-frame'
import { CancelBookingButton } from './cancel-button'

export const dynamic = 'force-dynamic'

interface CancelPageProps {
  params: Promise<{ agency: string; orderId: string }>
  searchParams: Promise<{ t?: string }>
}

const money = (n: number) => `$${n.toFixed(2)}`

/**
 * The customer's "Cancel booking" page, from the link in their confirmation
 * email (customers have no accounts; the link's token is the key). Shows the
 * refund the order's own terms give, then cancels on "yes".
 */
export default async function CancelBookingPage({ params, searchParams }: CancelPageProps) {
  const { agency: slug, orderId } = await params
  const { t = '' } = await searchParams
  const [agency, quote] = await Promise.all([getAgencyBySlug(slug), loadCancelQuote(slug, orderId, t)])
  const contact = [agency?.phone, agency?.email].filter(Boolean).join(' · ')

  const shell = (body: React.ReactNode) => (
    <BookingFrame agencyName={agency?.name ?? 'Your booking'} branding={activeBranding(agency)}>
      <main className="mx-auto grid w-full max-w-lg gap-4 px-4 py-10">
        {body}
        {contact && <p className="text-fine text-fg-muted">Questions? {contact}</p>}
      </main>
    </BookingFrame>
  )

  if (!quote) {
    return shell(
      <>
        <h1 className="font-display text-title font-semibold">This link isn&apos;t valid</h1>
        <p className="text-fg-muted">Please use the link from your confirmation email, or contact the agency to cancel.</p>
      </>
    )
  }

  const eventDay = quote.eventDate ? formatDay(quote.eventDate.slice(0, 10), true) : 'your event'

  if (!quote.canCancel) {
    return shell(
      <>
        <h1 className="font-display text-title font-semibold">
          {quote.status === 'cancelled' ? 'This booking is cancelled' : 'This booking can’t be cancelled online'}
        </h1>
        <p className="text-fg-muted">
          {quote.status === 'cancelled'
            ? `Order ${quote.orderNumber} for ${eventDay} was cancelled.`
            : `Your signs for order ${quote.orderNumber} are already out. Please contact the agency.`}
        </p>
      </>
    )
  }

  const { policy } = quote
  return shell(
    <>
      <h1 className="font-display text-title font-semibold">Cancel your booking?</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-card bg-surface-sunken p-4">
        <dt className="text-fg-muted">Order</dt><dd className="font-semibold">{quote.orderNumber}</dd>
        <dt className="text-fg-muted">Event day</dt><dd className="font-semibold">{eventDay}</dd>
        <dt className="text-fg-muted">Paid</dt><dd className="font-semibold">{money(quote.total)}</dd>
      </dl>
      <div className="rounded-card border border-line bg-surface p-4">
        {quote.insideNotice ? (
          <p>
            Your delivery is less than {policy.noticeHours} hours away, so under your booking terms <strong>no refund</strong> is due.
          </p>
        ) : (
          <p>
            You&apos;ll get <strong>{money(quote.refund)}</strong> back{quote.paidByCard ? ' to your card' : ''}
            {quote.fee > 0 ? ` (${money(quote.total)} minus the ${money(quote.fee)} cancellation fee in your booking terms)` : ''}.
          </p>
        )}
      </div>
      <CancelBookingButton agencySlug={slug} orderId={quote.orderId} token={t} refund={quote.refund} />
      <p className="text-fine text-fg-muted">
        If {agency?.name ?? 'the agency'} can&apos;t deliver or install your display, including because of weather, contact them: you get a full refund.
      </p>
    </>
  )
}
