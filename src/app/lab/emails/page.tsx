import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import {
  agencyCancellationHtml,
  customerCancellationHtml,
  customerConfirmationHtml,
  feeChargedHtml,
  feePaymentLinkHtml,
  orderNotificationHtml,
} from '@/lib/email'

export const metadata: Metadata = { title: 'Emails - lab' }

const AGENCY = { agencyName: 'Lucky Lawn Signs', agencyEmail: 'hello@luckylawn.example', agencyPhone: '(515) 555-0100' }
const FEES = { to: 'emma@example.com', customerName: 'Emma Carter', orderNumber: 'YCE-2026-264373', lateDays: 2, lateAmount: 50, damagedSigns: 1, damageAmount: 15, total: 65, ...AGENCY }

/** Every email we send, with sample data, as the inbox shows it (preview and dev only) */
export default function EmailsLabPage() {
  const emails: { title: string; to: string; html: string }[] = [
    {
      title: 'New booking',
      to: 'Agency',
      html: orderNotificationHtml({ orderNumber: 'YCE-2026-264373', customerName: 'Emma Carter', eventDate: '2026-11-07', totalAmount: 110, agencyEmail: AGENCY.agencyEmail, orderUrl: `${SITE_URL}/lucky-lawn/orders/1` }),
    },
    {
      title: 'Booking confirmation',
      to: 'Customer',
      html: customerConfirmationHtml({
        to: 'emma@example.com', customerName: 'Emma Carter', orderNumber: 'YCE-2026-264373', confirmationCode: 'K7Q2', eventDay: 'Saturday, November 7, 2026',
        address: '412 Maple St, Muscatine, IA 52761', displayImageUrl: `${SITE_URL}/preview-front-lawn.png`, totalAmount: 110, paidByCard: true, ...AGENCY,
        terms: [
          { title: 'Cancellation', text: 'Cancel at least 48 hours before delivery for a refund, minus a $10 fee.' },
          { title: 'Late pickup', text: '$25 for each day the signs can’t be picked up.' },
        ],
        cancelUrl: `${SITE_URL}/lucky-lawn/cancel/1?t=demo`,
      }),
    },
    {
      title: 'Booking cancelled',
      to: 'Customer',
      html: customerCancellationHtml({ to: 'emma@example.com', customerName: 'Emma Carter', orderNumber: 'YCE-2026-264373', eventDay: 'Saturday, November 7, 2026', refundAmount: 100, refundedToCard: true, cancelledByCustomer: true, ...AGENCY }),
    },
    {
      title: 'Customer cancelled',
      to: 'Agency',
      html: agencyCancellationHtml({ to: AGENCY.agencyEmail, orderNumber: 'YCE-2026-264373', customerName: 'Emma Carter', eventDay: 'Saturday, November 7, 2026', refundAmount: 100 }),
    },
    { title: 'Fees charged', to: 'Customer', html: feeChargedHtml({ ...FEES, cardLast4: '4242' }) },
    { title: 'Fees: payment needed', to: 'Customer', html: feePaymentLinkHtml({ ...FEES, payUrl: 'https://checkout.stripe.com/demo' }) },
  ]
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8">
      <div className="grid gap-1">
        <h1 className="font-display text-title font-semibold">Emails</h1>
        <p className="text-fg-muted">What each email looks like in an inbox, with sample data. Images load from the live site.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {emails.map(e => (
          <section key={e.title} className="grid gap-2">
            <h2 className="font-display text-heading font-semibold">{e.title} <span className="text-fine font-bold text-fg-muted">to the {e.to.toLowerCase()}</span></h2>
            <iframe title={e.title} srcDoc={e.html} className="h-[640px] w-full rounded-card border border-line bg-surface" />
          </section>
        ))}
      </div>
    </main>
  )
}
