import { getAgencyBySlug } from '@/lib/db/supabase-client'
import { loadCancelQuote } from '@/features/orders/customer-cancel'
import { formatDay } from '@/features/booking/booking-rules'
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
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <main className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-default">
        <p className="text-sm font-medium text-neutral-500">{agency?.name ?? 'Your booking'}</p>
        {body}
        {contact && <p className="mt-6 text-sm text-neutral-600">Questions? {contact}</p>}
      </main>
    </div>
  )

  if (!quote) {
    return shell(
      <>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">This link isn&apos;t valid</h1>
        <p className="mt-3 text-neutral-700">Please use the link from your confirmation email, or contact the agency to cancel.</p>
      </>
    )
  }

  const eventDay = quote.eventDate ? formatDay(quote.eventDate.slice(0, 10), true) : 'your event'

  if (!quote.canCancel) {
    return shell(
      <>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          {quote.status === 'cancelled' ? 'This booking is cancelled' : 'This booking can’t be cancelled online'}
        </h1>
        <p className="mt-3 text-neutral-700">
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
      <h1 className="mt-1 text-2xl font-bold text-neutral-900">Cancel your booking?</h1>
      <div className="mt-4 space-y-1 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-800">
        <p><strong>Order:</strong> {quote.orderNumber}</p>
        <p><strong>Event day:</strong> {eventDay}</p>
        <p><strong>Paid:</strong> {money(quote.total)}</p>
      </div>
      <div className="mt-4 rounded-lg border border-neutral-200 p-4">
        {quote.insideNotice ? (
          <p className="text-neutral-800">
            Your delivery is less than {policy.noticeHours} hours away, so under your booking terms <strong>no refund</strong> is due.
          </p>
        ) : (
          <p className="text-neutral-800">
            You&apos;ll get <strong>{money(quote.refund)}</strong> back{quote.paidByCard ? ' to your card' : ''}
            {quote.fee > 0 ? ` (${money(quote.total)} minus the ${money(quote.fee)} cancellation fee in your booking terms)` : ''}.
          </p>
        )}
      </div>
      <CancelBookingButton agencySlug={slug} orderId={quote.orderId} token={t} refund={quote.refund} />
      <p className="mt-3 text-xs text-neutral-500">
        If {agency?.name ?? 'the agency'} can&apos;t deliver or install your display, including because of weather, contact them: you get a full refund.
      </p>
    </>
  )
}
