// Server only (service-role Supabase + Stripe secret key). Never import from
// a 'use client' file.
//
// Turning a validated booking into an order, with or without a real charge.
// Card bookings for agencies on Stripe go through a booking_checkouts row:
// the validated order is saved BEFORE the charge, and the order is created
// exactly once AFTER the payment succeeds - by the booking page, or by the
// Stripe webhook if the customer's browser goes away (3-D Secure, closed tab).
// See migrations/20261016_stripe_checkout.sql for the status flow.

import type Stripe from 'stripe';
import { supabase } from '@/lib/db/supabase-client';
import { sendCustomerConfirmationEmail, sendOrderNotificationEmail } from '@/lib/email';
import { formatDay } from './booking-rules';
import { applicationFeeCents, getStripe, requestOrigin, toCents, type StripeAccountType } from '@/lib/stripe';

/** Everything needed to create the order later, validated by /api/orders/create. */
export interface OrderPayload {
  /** orders row, without order_number / confirmation_code / payment fields */
  order: Record<string, unknown>;
  /** phone: optional (older saved checkouts don't have it) */
  agency: { id: string; slug: string; name: string; email: string | null; phone?: string | null };
  holdId: string;
  sessionId: string;
  rentalStart: string;
  rentalEnd: string;
  totalDollars: number;
  customerName: string;
  eventDateIso: string;
}

export type OrderOutcome =
  | { ok: true; orderId: string; orderNumber: string; confirmationCode: string }
  | { ok: false; status: number; error: string };

const HOLD_ERRORS: Record<string, string> = {
  insufficient_stock: 'Some of your signs were booked by someone else while your reservation was idle. Please go back and regenerate your layout.',
  dates_changed: 'Your dates changed after your signs were reserved. Please go back and regenerate your layout.',
};

/**
 * Inserts the order and moves the session's sign hold onto it. No hold, no
 * order: an order without signs would let the same letters be booked twice.
 */
export async function createOrderFromPayload(
  payload: OrderPayload,
  payment: { method: string | null; intentId: string; status: 'pending' | 'paid' }
): Promise<OrderOutcome> {
  const year = new Date().getFullYear();
  const orderNumber = `YCE-${year}-${Math.floor(Math.random() * 900000) + 100000}`;
  const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data: orderRecord, error: insertError } = await supabase
    .from('orders')
    .insert([{
      ...payload.order,
      order_number: orderNumber,
      confirmation_code: confirmationCode,
      payment_method: payment.method,
      payment_intent_id: payment.intentId,
      stripe_payment_intent_id: payment.intentId.startsWith('pi_') && !payment.intentId.startsWith('pi_mock') ? payment.intentId : null,
      payment_status: payment.status,
      updated_at: new Date().toISOString(),
    }])
    .select('id, order_number')
    .single();
  if (insertError || !orderRecord) {
    console.error('Order insert failed:', insertError);
    // Details stay in the log; customers get something they can act on
    return { ok: false, status: 500, error: "We couldn't save your order. Please try again in a moment." };
  }

  const { data: conversion, error: conversionError } = await supabase.rpc('yce_convert_hold_to_order', {
    p_hold_id: payload.holdId,
    p_agency_id: payload.agency.id,
    p_session_id: payload.sessionId,
    p_order_id: orderRecord.id,
    p_rental_start: payload.rentalStart,
    p_rental_end: payload.rentalEnd,
  });
  let converted = conversion as { ok?: boolean; reason?: string } | null;
  if (conversionError) {
    // The call may have committed and only the response was lost: if the
    // hold now belongs to this order, the conversion succeeded.
    const { data: ownHold } = await supabase
      .from('inventory_holds')
      .select('id')
      .eq('id', payload.holdId)
      .eq('order_id', orderRecord.id)
      .eq('hold_type', 'order')
      .maybeSingle();
    if (ownHold) converted = { ok: true };
  }
  if (!converted?.ok) {
    console.warn('Hold conversion failed:', conversionError?.message ?? converted?.reason);
    const { error: deleteError } = await supabase.from('orders').delete().eq('id', orderRecord.id);
    if (deleteError) console.error('Could not roll back order without signs:', orderRecord.id, deleteError.message);
    return {
      ok: false,
      status: 409,
      error: HOLD_ERRORS[converted?.reason ?? ''] ?? 'Your sign reservation has ended. Please go back and regenerate your layout.',
    };
  }

  // No address, no email (a made-up recipient would bounce and hurt the
  // sending domain's reputation)
  if (!payload.agency.email) {
    console.warn('Agency has no contact email; order notification skipped:', payload.agency.slug);
  } else {
    try {
      const origin = await requestOrigin().catch(() => null);
      await sendOrderNotificationEmail({
        orderNumber: orderRecord.order_number,
        customerName: payload.customerName,
        eventDate: payload.eventDateIso,
        totalAmount: payload.totalDollars,
        agencyName: payload.agency.name,
        agencyEmail: payload.agency.email,
        orderUrl: origin ? `${origin}/${payload.agency.slug}/orders/${orderRecord.id}` : undefined,
      });
    } catch (emailError) {
      console.error('Order notification email failed (order stands):', emailError);
    }
  }

  // The customer's confirmation (the order stands if it fails)
  const order = payload.order as { customer_email?: string; event_address?: string; display_image_url?: string | null; terms_snapshot?: { sections?: { title: string; text: string }[] } };
  if (order.customer_email) {
    try {
      await sendCustomerConfirmationEmail({
        to: order.customer_email,
        customerName: payload.customerName,
        orderNumber: orderRecord.order_number,
        confirmationCode,
        eventDay: formatDay(payload.eventDateIso.slice(0, 10), true),
        address: order.event_address ?? '',
        displayImageUrl: order.display_image_url ?? null,
        totalAmount: payload.totalDollars,
        paidByCard: payment.status === 'paid',
        agencyName: payload.agency.name,
        agencyEmail: payload.agency.email,
        agencyPhone: payload.agency.phone ?? null,
        terms: order.terms_snapshot?.sections ?? [],
      });
    } catch (emailError) {
      console.error('Customer confirmation email failed (order stands):', emailError);
    }
  }

  return { ok: true, orderId: orderRecord.id, orderNumber: orderRecord.order_number, confirmationCode };
}

// ------------------------------------------------------------- card checkout

export interface StripeAgency {
  stripe_account_id: string;
  stripe_account_type: StripeAccountType | null;
}

export type CheckoutOutcome =
  | OrderOutcome
  | { ok: false; requiresAction: true; clientSecret: string; paymentIntentId: string };

function declineMessage(error: unknown): string {
  const e = error as Stripe.errors.StripeError | undefined;
  if (e?.type === 'StripeCardError' && e.message) return `${e.message} Please go back to Payment and try another card.`;
  return 'Your payment could not be completed. Please go back to Payment and try again.';
}

/**
 * Charges the card collected on the Payment step (a ConfirmationToken) as a
 * direct charge on the agency's account, saving the card for later fees
 * (late returns, damage). Creates the order if the charge succeeds now; on
 * 3-D Secure returns what the page needs to ask the customer.
 */
export async function startCardCheckout(input: {
  agency: StripeAgency;
  payload: OrderPayload;
  confirmationTokenId: string;
  customer: { name: string; email: string; phone: string };
  returnUrl: string;
}): Promise<CheckoutOutcome> {
  const { agency, payload } = input;
  const stripe = getStripe();
  const stripeAccount = agency.stripe_account_id;
  const amountCents = toCents(payload.totalDollars);
  const feeCents = applicationFeeCents(agency.stripe_account_type);

  // One paid checkout per sign hold: a second tab or a repeated submit must
  // not charge the customer twice
  const { data: paidAlready } = await supabase
    .from('booking_checkouts')
    .select('id')
    .eq('agency_id', payload.agency.id)
    .eq('hold_id', payload.holdId)
    .in('status', ['charged', 'finalizing', 'completed'])
    .limit(1)
    .maybeSingle();
  if (paidAlready) return finalizeCheckout(paidAlready.id);

  const { data: checkout, error: checkoutError } = await supabase
    .from('booking_checkouts')
    .insert({
      agency_id: payload.agency.id,
      hold_id: payload.holdId,
      session_id: payload.sessionId,
      stripe_account_id: stripeAccount,
      amount_cents: amountCents,
      application_fee_cents: feeCents,
      payload,
    })
    .select('id')
    .single();
  if (checkoutError || !checkout) {
    console.error('booking_checkouts insert failed:', checkoutError);
    return { ok: false, status: 500, error: "We couldn't start your payment. Please try again in a moment." };
  }

  let intent: Stripe.PaymentIntent;
  try {
    // The customer lives on the agency's account (their customer, their card)
    const customer = await stripe.customers.create(
      { name: input.customer.name, email: input.customer.email, phone: input.customer.phone },
      { stripeAccount, idempotencyKey: `checkout-${checkout.id}-customer` }
    );
    intent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        confirm: true,
        confirmation_token: input.confirmationTokenId,
        payment_method_types: ['card'],
        customer: customer.id,
        setup_future_usage: 'off_session',
        ...(feeCents > 0 ? { application_fee_amount: feeCents } : {}),
        receipt_email: input.customer.email,
        description: `${payload.agency.name} yard display`,
        return_url: input.returnUrl,
        metadata: { yce_checkout_id: checkout.id, yce_agency_id: payload.agency.id, yce_hold_id: payload.holdId },
      },
      { stripeAccount, idempotencyKey: `checkout-${checkout.id}-intent` }
    );
  } catch (error) {
    console.warn('Card charge failed:', (error as Error)?.message);
    await supabase.from('booking_checkouts')
      .update({ status: 'failed', error: (error as Error)?.message ?? 'charge failed', updated_at: new Date().toISOString() })
      .eq('id', checkout.id);
    return { ok: false, status: 402, error: declineMessage(error) };
  }

  await supabase.from('booking_checkouts')
    .update({ payment_intent_id: intent.id, updated_at: new Date().toISOString() })
    .eq('id', checkout.id);
  return settle(checkout.id, intent);
}

/** After 3-D Secure: the page sends back the PaymentIntent it confirmed. */
export async function resumeCardCheckout(input: {
  agency: StripeAgency;
  agencyId: string;
  sessionId: string;
  paymentIntentId: string;
}): Promise<CheckoutOutcome> {
  const { data: checkout } = await supabase
    .from('booking_checkouts')
    .select('id, agency_id, session_id')
    .eq('payment_intent_id', input.paymentIntentId)
    .maybeSingle();
  if (!checkout || checkout.agency_id !== input.agencyId || checkout.session_id !== input.sessionId) {
    return { ok: false, status: 404, error: 'We could not find this payment. Please go back to Payment and try again.' };
  }
  const intent = await getStripe().paymentIntents.retrieve(input.paymentIntentId, {
    stripeAccount: input.agency.stripe_account_id,
  });
  return settle(checkout.id, intent);
}

async function settle(checkoutId: string, intent: Stripe.PaymentIntent): Promise<CheckoutOutcome> {
  if (intent.status === 'succeeded') {
    await markCharged(checkoutId);
    return finalizeCheckout(checkoutId);
  }
  if (intent.status === 'requires_action' && intent.client_secret) {
    return { ok: false, requiresAction: true, clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }
  const reason = intent.last_payment_error?.message;
  await supabase.from('booking_checkouts')
    .update({ status: 'failed', error: reason ?? intent.status, updated_at: new Date().toISOString() })
    .eq('id', checkoutId)
    .eq('status', 'created');
  return {
    ok: false,
    status: 402,
    error: reason
      ? `${reason} Please go back to Payment and try another card.`
      : 'Your payment was not completed. Please go back to Payment and try again.',
  };
}

async function markCharged(checkoutId: string) {
  await supabase.from('booking_checkouts')
    .update({ status: 'charged', updated_at: new Date().toISOString() })
    .eq('id', checkoutId)
    .in('status', ['created', 'failed']);
}

/**
 * Creates the order for a paid checkout, exactly once. The booking page and
 * the webhook can both call this: whoever moves the row from 'charged' to
 * 'finalizing' does the work; the other waits for its result. If the signs
 * can no longer be secured, the payment is refunded in full (including the
 * platform fee).
 */
export async function finalizeCheckout(checkoutId: string): Promise<OrderOutcome> {
  const { data: claimed } = await supabase
    .from('booking_checkouts')
    .update({ status: 'finalizing', updated_at: new Date().toISOString() })
    .eq('id', checkoutId)
    .eq('status', 'charged')
    .select('id, payload, payment_intent_id, stripe_account_id')
    .maybeSingle();

  if (!claimed) return waitForOutcome(checkoutId);

  const payload = claimed.payload as OrderPayload;
  const outcome = await createOrderFromPayload(payload, {
    method: 'card',
    intentId: claimed.payment_intent_id,
    status: 'paid',
  });

  if (outcome.ok) {
    await supabase.from('booking_checkouts')
      .update({ status: 'completed', order_id: outcome.orderId, updated_at: new Date().toISOString() })
      .eq('id', checkoutId);
    return outcome;
  }

  // Paid, but no order: give the money back rather than keep it for nothing
  try {
    await getStripe().refunds.create(
      { payment_intent: claimed.payment_intent_id, refund_application_fee: true, reason: 'requested_by_customer' },
      { stripeAccount: claimed.stripe_account_id, idempotencyKey: `checkout-${checkoutId}-refund` }
    );
    await supabase.from('booking_checkouts')
      .update({ status: 'refunded', error: outcome.error, updated_at: new Date().toISOString() })
      .eq('id', checkoutId);
    return { ...outcome, error: `${outcome.error} Your payment was refunded in full.` };
  } catch (refundError) {
    // Leave it 'finalizing' so it stands out; the agency must refund by hand
    console.error('REFUND FAILED for paid checkout without order:', checkoutId, refundError);
    await supabase.from('booking_checkouts')
      .update({ error: `order failed (${outcome.error}); refund failed`, updated_at: new Date().toISOString() })
      .eq('id', checkoutId);
    return { ...outcome, error: `${outcome.error} Your payment will be refunded; the agency has been notified.` };
  }
}

async function waitForOutcome(checkoutId: string): Promise<OrderOutcome> {
  for (let i = 0; i < 16; i++) {
    const { data } = await supabase
      .from('booking_checkouts')
      .select('status, order_id, error, orders(order_number, confirmation_code)')
      .eq('id', checkoutId)
      .maybeSingle();
    if (!data) break;
    if (data.status === 'completed' && data.order_id) {
      const order = (Array.isArray(data.orders) ? data.orders[0] : data.orders) as
        { order_number: string; confirmation_code: string } | null;
      return { ok: true, orderId: data.order_id, orderNumber: order?.order_number ?? '', confirmationCode: order?.confirmation_code ?? '' };
    }
    if (data.status === 'refunded' || data.status === 'failed') {
      return { ok: false, status: 409, error: `${data.error ?? 'Your order could not be completed.'}` };
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return { ok: false, status: 409, error: 'Your payment went through and your order is still being saved. Please refresh in a minute.' };
}

/** Stripe webhook: payment_intent.succeeded on a connected account. */
export async function handleCheckoutPaymentSucceeded(intent: Stripe.PaymentIntent) {
  const checkoutId = intent.metadata?.yce_checkout_id;
  if (!checkoutId) return;
  await supabase.from('booking_checkouts')
    .update({ payment_intent_id: intent.id, updated_at: new Date().toISOString() })
    .eq('id', checkoutId)
    .is('payment_intent_id', null);
  await markCharged(checkoutId);
  const outcome = await finalizeCheckout(checkoutId);
  if (!outcome.ok) console.warn('Webhook finalize did not create an order:', checkoutId, outcome.error);
}

/** Stripe webhook: payment_intent.payment_failed / canceled. */
export async function handleCheckoutPaymentFailed(intent: Stripe.PaymentIntent) {
  const checkoutId = intent.metadata?.yce_checkout_id;
  if (!checkoutId) return;
  await supabase.from('booking_checkouts')
    .update({ status: 'failed', error: intent.last_payment_error?.message ?? intent.status, updated_at: new Date().toISOString() })
    .eq('id', checkoutId)
    .eq('status', 'created');
}

/**
 * Stripe webhook: charge.refunded on a connected account. Mirrors the total
 * refunded onto the order, so refunds made in the agency's Stripe Dashboard
 * (not through the app's cancel) show up too. Idempotent: it writes Stripe's
 * running total, never adds to ours.
 */
export async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId || !charge.amount_refunded) return;
  const { data: checkout } = await supabase
    .from('booking_checkouts')
    .select('id, order_id, agency_id')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();
  if (!checkout?.order_id) return; // not a booking payment (or no order)
  const refunded = charge.amount_refunded / 100;
  const { error } = await supabase
    .from('orders')
    .update({
      refund_amount: refunded,
      payment_status: charge.refunded ? 'refunded' : 'partially_refunded',
    })
    .eq('id', checkout.order_id)
    .eq('agency_id', checkout.agency_id);
  if (error) {
    console.error('charge.refunded: order not updated:', checkout.order_id, error.message);
    return;
  }
  await supabase.from('booking_checkouts')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', checkout.id);
  console.log('✅ Refund mirrored onto order', checkout.order_id, { refunded });
}
