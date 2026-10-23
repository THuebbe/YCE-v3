import { SITE_URL } from '@/lib/site';
import {
  agencyCancellationHtml,
  customerCancellationHtml,
  customerConfirmationHtml,
  feeChargedHtml,
  feePaymentLinkHtml,
  orderNotificationHtml,
} from '@/lib/email';

/**
 * Every email we send, filled with sample data: /lab/emails shows them and
 * `pnpm test-email` sends them to a real inbox. Subjects match the real ones.
 */
const AGENCY = { agencyName: 'Lucky Lawn Signs', agencyEmail: 'hello@luckylawn.example', agencyPhone: '(515) 555-0100' };
const FEES = { to: 'emma@example.com', customerName: 'Emma Carter', orderNumber: 'YCE-2026-264373', lateDays: 2, lateAmount: 50, damagedSigns: 1, damageAmount: 15, total: 65, ...AGENCY };

export function sampleEmails(): { title: string; to: 'agency' | 'customer'; subject: string; html: string }[] {
  return [
    {
      title: 'New booking',
      to: 'agency',
      subject: 'New booking: Emma Carter, Saturday, November 7, 2026 (YCE-2026-264373)',
      html: orderNotificationHtml({ orderNumber: 'YCE-2026-264373', customerName: 'Emma Carter', eventDate: '2026-11-07', totalAmount: 110, agencyEmail: AGENCY.agencyEmail, orderUrl: `${SITE_URL}/lucky-lawn/orders/1` }),
    },
    {
      title: 'Booking confirmation',
      to: 'customer',
      subject: 'Your booking with Lucky Lawn Signs: Saturday, November 7, 2026',
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
      to: 'customer',
      subject: 'Booking cancelled: YCE-2026-264373',
      html: customerCancellationHtml({ to: 'emma@example.com', customerName: 'Emma Carter', orderNumber: 'YCE-2026-264373', eventDay: 'Saturday, November 7, 2026', refundAmount: 100, refundedToCard: true, cancelledByCustomer: true, ...AGENCY }),
    },
    {
      title: 'Customer cancelled',
      to: 'agency',
      subject: 'Cancelled by the customer: YCE-2026-264373',
      html: agencyCancellationHtml({ to: AGENCY.agencyEmail, orderNumber: 'YCE-2026-264373', customerName: 'Emma Carter', eventDay: 'Saturday, November 7, 2026', refundAmount: 100 }),
    },
    { title: 'Fees charged', to: 'customer', subject: 'Fees for order YCE-2026-264373', html: feeChargedHtml({ ...FEES, cardLast4: '4242' }) },
    { title: 'Fees: payment needed', to: 'customer', subject: 'Payment needed: fees for order YCE-2026-264373', html: feePaymentLinkHtml({ ...FEES, payUrl: 'https://checkout.stripe.com/demo' }) },
  ];
}
