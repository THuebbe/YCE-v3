// Server only: late and damage fees after check-in (PRODUCT.md "Late fees",
// "Damage fees", "Collecting late/damage fees"). Never automatic: the app
// proposes, the agency charges or waives.
import type Stripe from 'stripe';
import { supabase } from '@/lib/db/supabase-client';
import { getStripe, requestOrigin, toCents } from '@/lib/stripe';
import { feesPolicyOf } from '@/features/booking/terms';
import { effectivePolicies } from '@/features/booking/policies';
import { resolveTimeZone, todayIn } from '@/features/booking/booking-rules';
import { sendFeeChargedEmail, sendFeePaymentLinkEmail } from '@/lib/email';
import { checkFeeAmounts, feeCaps, round2 } from './fee-math';

export interface FeeCharge {
  status: 'charged' | 'link_sent' | 'waived' | 'failed';
  lateDays: number;
  lateAmount: number;
  damagedSigns: number;
  damageAmount: number;
  total: number;
  paymentIntentId?: string;
  checkoutUrl?: string;
  error?: string;
  at: string;
  by: string;
}

export interface FeeQuote {
  /** Scheduled pickup day (the order's hold end) and the day it was checked in */
  pickupDay: string | null;
  checkInDay: string | null;
  lateDays: number;
  lateFee: number;
  damagedSigns: number;
  damageFeePerSign: number;
  /** The most that may be charged: what the customer agreed to */
  lateMax: number;
  damageMax: number;
  /** The fee amounts came from the order's saved terms (else today's policy) */
  fromBookingTerms: boolean;
  card: { brand: string; last4: string } | null;
  existing: FeeCharge | null;
}

interface SavedCard {
  stripeAccount: string;
  customer: string;
  paymentMethod: string;
  brand: string;
  last4: string;
}

/** The card saved at booking (setup_future_usage on the booking payment) */
async function savedCard(orderId: string, agencyId: string): Promise<SavedCard | null> {
  const { data: checkout } = await supabase
    .from('booking_checkouts')
    .select('payment_intent_id, stripe_account_id')
    .eq('order_id', orderId).eq('agency_id', agencyId)
    .in('status', ['completed', 'refunded'])
    .maybeSingle();
  if (!checkout?.payment_intent_id || !checkout.stripe_account_id) return null;
  try {
    const pi = await getStripe().paymentIntents.retrieve(
      checkout.payment_intent_id,
      { expand: ['payment_method'] },
      { stripeAccount: checkout.stripe_account_id },
    );
    const pm = pi.payment_method as Stripe.PaymentMethod | null;
    const customer = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id;
    if (!pm?.card || !customer) return null;
    return { stripeAccount: checkout.stripe_account_id, customer, paymentMethod: pm.id, brand: pm.card.brand, last4: pm.card.last4 };
  } catch (error) {
    console.error('savedCard lookup failed:', orderId, error);
    return null;
  }
}

/** What the agency may charge for a completed (checked-in) order */
export async function getFeeQuote(orderId: string, agencyId: string): Promise<FeeQuote | null> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, completed_at, terms_snapshot, fee_charge, agency:agencies(plan, policy_config, pricing_config, operating_hours)')
    .eq('id', orderId).eq('agency_id', agencyId)
    .maybeSingle();
  if (!order || order.status !== 'completed') return null;
  const agency = (Array.isArray(order.agency) ? order.agency[0] : order.agency) as Record<string, unknown> | null;

  const saved = feesPolicyOf(order.terms_snapshot);
  const current = effectivePolicies(agency ?? {});
  const lateFee = saved?.lateFee ?? current.lateFee;
  const damageFeePerSign = saved?.damageFeePerSign ?? current.damageFeePerSign;

  const [{ data: hold }, { data: checkIns }, card] = await Promise.all([
    supabase.from('inventory_holds').select('rental_end').eq('order_id', orderId).eq('agency_id', agencyId).eq('hold_type', 'order').maybeSingle(),
    supabase.from('sign_check_ins').select('condition, quantity').eq('order_id', orderId),
    savedCard(orderId, agencyId),
  ]);

  const pickupDay = (hold?.rental_end as string | null) ?? null;
  const completedAt = order.completed_at as string | null;
  const checkInDay = completedAt
    ? todayIn(resolveTimeZone(agency?.operating_hours), new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(completedAt) ? completedAt : `${completedAt}Z`))
    : null;
  const damagedSigns = (checkIns ?? [])
    .filter(c => c.condition === 'damaged' || c.condition === 'missing')
    .reduce((sum, c) => sum + (Number(c.quantity) || 1), 0);

  return {
    pickupDay,
    checkInDay,
    lateFee,
    damagedSigns,
    damageFeePerSign,
    ...feeCaps({ pickupDay, checkInDay, lateFee, damagedSigns, damageFeePerSign }),
    fromBookingTerms: !!saved,
    card: card ? { brand: card.brand, last4: card.last4 } : null,
    existing: (order.fee_charge as FeeCharge | null) ?? null,
  };
}

type AssessResult = { success: true; charge: FeeCharge } | { success: false; error: string };

/**
 * Charges (or waives) the fees the agency confirmed. Amounts may be lowered
 * but never above what the terms allow. Card first; if the bank declines or
 * wants the customer to approve, the customer gets a payment link instead.
 */
export async function assessFees(input: {
  orderId: string;
  agencyId: string;
  agencySlug: string;
  lateAmount: number;
  damageAmount: number;
  userId: string;
}): Promise<AssessResult> {
  const quote = await getFeeQuote(input.orderId, input.agencyId);
  if (!quote) return { success: false, error: 'Fees can only be assessed after the signs are checked in' };
  if (quote.existing && quote.existing.status !== 'failed') {
    return { success: false, error: 'Fees for this order were already handled' };
  }
  const amounts = checkFeeAmounts(input.lateAmount, input.damageAmount, quote);
  if ('error' in amounts) return { success: false, error: amounts.error };
  const { lateAmount, damageAmount, total } = amounts;
  const base = {
    lateDays: quote.lateDays, lateAmount,
    damagedSigns: quote.damagedSigns, damageAmount,
    total, at: new Date().toISOString(), by: input.userId,
  };

  const save = async (charge: FeeCharge) => {
    const { error } = await supabase
      .from('orders')
      .update({ fee_charge: charge, late_fee: charge.status === 'waived' ? 0 : lateAmount, updated_at: new Date().toISOString() })
      .eq('id', input.orderId).eq('agency_id', input.agencyId);
    if (error) console.error('fee_charge not saved:', input.orderId, error.message);
    return charge;
  };

  if (total <= 0) return { success: true, charge: await save({ ...base, status: 'waived' }) };

  const { data: order } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_email, agency:agencies(name, email, phone)')
    .eq('id', input.orderId).eq('agency_id', input.agencyId).single();
  const agency = (Array.isArray(order?.agency) ? order?.agency[0] : order?.agency) as { name: string; email: string | null; phone: string | null } | undefined;
  const description = `Late/damage fees for order ${order?.order_number ?? ''}`.trim();
  const card = await savedCard(input.orderId, input.agencyId);
  const { data: checkout } = await supabase
    .from('booking_checkouts').select('stripe_account_id')
    .eq('order_id', input.orderId).eq('agency_id', input.agencyId).maybeSingle();
  const stripeAccount = card?.stripeAccount ?? checkout?.stripe_account_id;
  if (!stripeAccount) return { success: false, error: 'This order wasn\'t paid through your Stripe account, so fees can\'t be charged here' };
  const metadata = { yce_fee_order_id: input.orderId, yce_late: String(lateAmount), yce_damage: String(damageAmount) };
  const emailCommon = {
    to: order?.customer_email ?? '',
    customerName: order?.customer_name ?? '',
    orderNumber: order?.order_number ?? '',
    lateDays: quote.lateDays, lateAmount,
    damagedSigns: quote.damagedSigns, damageAmount, total,
    agencyName: agency?.name ?? 'Your yard sign company',
    agencyEmail: agency?.email ?? null,
    agencyPhone: agency?.phone ?? null,
  };

  // 1. The saved card, off-session. All of it goes to the agency (no platform fee).
  let cardError: string | null = card ? null : 'No saved card';
  if (card) {
    try {
      const pi = await getStripe().paymentIntents.create(
        {
          amount: toCents(total), currency: 'usd',
          customer: card.customer, payment_method: card.paymentMethod,
          off_session: true, confirm: true,
          description, metadata,
          ...(order?.customer_email ? { receipt_email: order.customer_email } : {}),
        },
        { stripeAccount, idempotencyKey: `order-${input.orderId}-fees-${toCents(total)}` },
      );
      if (pi.status === 'succeeded') {
        const charge = await save({ ...base, status: 'charged', paymentIntentId: pi.id });
        if (emailCommon.to) await sendFeeChargedEmail({ ...emailCommon, cardLast4: card.last4 }).catch(e => console.error('fee email failed:', e));
        return { success: true, charge };
      }
      cardError = `Payment ${pi.status}`;
    } catch (error) {
      cardError = (error as { message?: string })?.message ?? 'The card was declined';
      console.warn('Fee charge on saved card failed, sending a payment link:', input.orderId, cardError);
    }
  }

  // 2. A payment link (Stripe Checkout on the agency's account)
  try {
    const origin = await requestOrigin();
    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: toCents(total), product_data: { name: description } } }],
        ...(card ? { customer: card.customer } : order?.customer_email ? { customer_email: order.customer_email } : {}),
        payment_intent_data: { description, metadata },
        metadata,
        success_url: `${origin}/${input.agencySlug}/paid`,
        cancel_url: `${origin}/${input.agencySlug}/paid?cancelled=1`,
      },
      { stripeAccount },
    );
    const charge = await save({ ...base, status: 'link_sent', checkoutUrl: session.url ?? undefined, error: cardError ?? undefined });
    if (emailCommon.to && session.url) await sendFeePaymentLinkEmail({ ...emailCommon, payUrl: session.url }).catch(e => console.error('fee link email failed:', e));
    return { success: true, charge };
  } catch (error) {
    const message = (error as { message?: string })?.message ?? 'Stripe refused';
    await save({ ...base, status: 'failed', error: `${cardError ?? ''}; link: ${message}` });
    return { success: false, error: `The card was declined and a payment link couldn't be made (${message}). Try again later.` };
  }
}

/** Webhook: the customer paid the fee link (Connect checkout.session.completed) */
export async function handleFeeCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.yce_fee_order_id;
  if (!orderId || session.payment_status !== 'paid') return;
  const { data: order } = await supabase.from('orders').select('agency_id, fee_charge').eq('id', orderId).maybeSingle();
  const current = order?.fee_charge as FeeCharge | null;
  if (!order || !current || current.status === 'charged') return;
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  await supabase.from('orders')
    .update({ fee_charge: { ...current, status: 'charged', paymentIntentId, at: new Date().toISOString() } })
    .eq('id', orderId).eq('agency_id', order.agency_id);
  console.log('✅ Fee link paid', orderId, paymentIntentId);
}

