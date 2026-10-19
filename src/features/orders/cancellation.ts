// Server only (not a server action): callers check who may cancel first.
import { supabase } from '@/lib/db/supabase-client';
import { getStripe, toCents } from '@/lib/stripe';
import { sendAgencyCancellationNotice, sendCustomerCancellationEmail } from '@/lib/email';
import { formatDay } from '@/features/booking/booking-rules';

type CancellationResult = { success: true; refunded: boolean } | { success: false; error: string };

/**
 * Refunds (card orders, through the agency's Stripe) and then cancels.
 * Shared by the agency's Cancel button and the customer's cancel link, so
 * both follow the same order: no cancel if the refund fails. The platform
 * keeps its $3 (refund_application_fee false).
 */
export async function performCancellation(input: {
  orderId: string;
  agencyId: string;
  total: number;
  refundAmount: number;
  refundType: 'full' | 'partial' | 'none';
  /** order_activities.user_id (required): the agency member, or the agency's admin for customer cancels */
  actorUserId: string;
  reason: string;
  cancelledBy?: 'agency' | 'customer';
}): Promise<CancellationResult> {
  const { orderId, agencyId, total, refundAmount } = input;

  // Paid by card through Stripe? (the checkout that created this order)
  const { data: checkout } = await supabase
    .from('booking_checkouts')
    .select('id, payment_intent_id, stripe_account_id')
    .eq('order_id', orderId).eq('agency_id', agencyId).eq('status', 'completed')
    .maybeSingle();

  let refunded = false;
  if (checkout?.payment_intent_id && refundAmount > 0) {
    try {
      await getStripe().refunds.create(
        {
          payment_intent: checkout.payment_intent_id,
          amount: toCents(refundAmount),
          refund_application_fee: false,
          reason: 'requested_by_customer',
          metadata: { yce_order_id: orderId, yce_cancelled_by: input.cancelledBy === 'customer' ? 'customer' : input.actorUserId },
        },
        { stripeAccount: checkout.stripe_account_id, idempotencyKey: `order-${orderId}-refund-${toCents(refundAmount)}` }
      );
      refunded = true;
    } catch (error) {
      const reason = (error as { message?: string })?.message ?? 'Stripe refused the refund';
      console.error('Cancel refund failed:', orderId, reason);
      return { success: false, error: `The refund didn't go through (${reason}). The order was not cancelled.` };
    }
  }

  const { data, error } = await supabase.rpc('yce_cancel_order', {
    p_order_id: orderId,
    p_agency_id: agencyId,
    p_user_id: input.actorUserId,
    p_reason: input.reason,
    p_refund_type: input.refundType,
  });
  const result = data as { ok?: boolean; reason?: string; status?: string } | null;
  if (error || !result?.ok) {
    if (refunded) console.error('REFUNDED BUT NOT CANCELLED - cancel it by hand:', orderId, error?.message ?? result);
    return {
      success: false,
      error: refunded
        ? 'The refund was issued, but the order could not be marked cancelled. Please try cancelling again.'
        : result?.reason === 'not_cancellable' ? `A ${result.status} order can't be cancelled` : 'Cancel failed',
    };
  }

  const { error: refundError } = await supabase
    .from('orders')
    .update({
      refund_amount: refundAmount,
      ...(refunded ? { payment_status: refundAmount >= total ? 'refunded' : 'partially_refunded' } : {}),
    })
    .eq('id', orderId).eq('agency_id', agencyId);
  if (refundError) console.error('refund_amount not saved:', orderId, refundError.message);
  if (refunded) {
    await supabase.from('booking_checkouts')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', checkout!.id);
  }
  await notifyCancellation(orderId, agencyId, refundAmount, refunded, input.cancelledBy ?? 'agency');
  return { success: true, refunded };
}

/** Emails the customer (and the agency, when the customer cancelled); the cancellation stands if it fails */
async function notifyCancellation(orderId: string, agencyId: string, refundAmount: number, refundedToCard: boolean, cancelledBy: 'agency' | 'customer') {
  try {
    const { data } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_email, event_date, agency:agencies(name, email, phone, slug)')
      .eq('id', orderId).eq('agency_id', agencyId).single();
    const agency = (Array.isArray(data?.agency) ? data?.agency[0] : data?.agency) as { name: string; email: string | null; phone: string | null; slug: string } | undefined;
    if (!data || !agency) return;
    const eventDay = data.event_date ? formatDay(String(data.event_date).slice(0, 10), true) : 'your event';
    if (data.customer_email) {
      await sendCustomerCancellationEmail({
        to: data.customer_email,
        customerName: data.customer_name ?? '',
        orderNumber: data.order_number,
        eventDay,
        refundAmount,
        refundedToCard,
        cancelledByCustomer: cancelledBy === 'customer',
        agencyName: agency.name,
        agencyEmail: agency.email,
        agencyPhone: agency.phone,
      });
    }
    if (cancelledBy === 'customer' && agency.email) {
      await sendAgencyCancellationNotice({
        to: agency.email,
        orderNumber: data.order_number,
        customerName: data.customer_name ?? '',
        eventDay,
        refundAmount,
      });
    }
  } catch (error) {
    console.error('Cancellation email failed (order stays cancelled):', orderId, error);
  }
}
