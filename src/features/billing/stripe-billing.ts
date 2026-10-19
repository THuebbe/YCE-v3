// Server only: never import this from a 'use client' file.
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/db/supabase-client';
import { PRICE_KEYS, priceKeyInfo, type BillingInterval } from './subscription';
import type { Plan } from './entitlements';

/**
 * Agency subscriptions are Stripe Billing on the PLATFORM account (no
 * stripeAccount option), separate from the Connect booking payments.
 */

/** Free trial for an agency's first subscription; BILLING_TRIAL_DAYS=0 turns it off */
export function trialDays(): number {
  const raw = process.env.BILLING_TRIAL_DAYS;
  const days = raw === undefined || raw === '' ? 14 : Number(raw);
  return Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
}

let priceIds: Map<string, string> | null = null;
/** Price lookup key -> Stripe price id (cached per server instance) */
async function priceIdFor(key: string): Promise<string> {
  if (!priceIds?.has(key)) {
    const all = Object.values(PRICE_KEYS).flatMap(byInterval => Object.values(byInterval));
    const { data } = await getStripe().prices.list({ lookup_keys: all, active: true, limit: all.length });
    priceIds = new Map(data.filter(p => p.lookup_key).map(p => [p.lookup_key!, p.id]));
  }
  const id = priceIds.get(key);
  if (!id) throw new Error(`No active Stripe price with lookup key ${key}`);
  return id;
}

interface BillingAgency {
  id: string;
  slug: string;
  name: string | null;
  email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

async function loadAgency(agencyId: string): Promise<BillingAgency> {
  const { data, error } = await supabase
    .from('agencies')
    .select('id, slug, name, email, stripe_customer_id, stripe_subscription_id')
    .eq('id', agencyId)
    .single();
  if (error || !data) throw new Error('Agency not found');
  return data as BillingAgency;
}

/** The agency's Stripe customer on the platform, created on first use */
async function ensureCustomer(agency: BillingAgency, email: string | null): Promise<string> {
  if (agency.stripe_customer_id) return agency.stripe_customer_id;
  const customer = await getStripe().customers.create(
    {
      name: agency.name ?? agency.slug,
      email: email ?? agency.email ?? undefined,
      metadata: { agency_id: agency.id, agency_slug: agency.slug },
    },
    { idempotencyKey: `agency-${agency.id}-customer` },
  );
  // Only set it if still empty: a parallel request may have won
  const { data } = await supabase
    .from('agencies')
    .update({ stripe_customer_id: customer.id })
    .eq('id', agency.id)
    .is('stripe_customer_id', null)
    .select('stripe_customer_id');
  if (data?.length) return customer.id;
  return (await loadAgency(agency.id)).stripe_customer_id!;
}

/** Stripe Checkout (subscription mode) for an agency without a live subscription */
export async function createSubscriptionCheckout(input: {
  agencyId: string;
  plan: Plan;
  interval: BillingInterval;
  email: string | null;
  returnUrl: string; // the settings page; ?billing=... is appended
}): Promise<string> {
  const agency = await loadAgency(input.agencyId);
  const customer = await ensureCustomer(agency, input.email);
  // One trial per agency: an agency that ever subscribed starts paying
  const trial = agency.stripe_subscription_id ? 0 : trialDays();
  const sep = input.returnUrl.includes('?') ? '&' : '?';
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: agency.id,
    line_items: [{ price: await priceIdFor(PRICE_KEYS[input.plan][input.interval]), quantity: 1 }],
    // Card up front, even for the trial (PRODUCT.md)
    payment_method_collection: 'always',
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { agency_id: agency.id },
      ...(trial ? { trial_period_days: trial } : {}),
    },
    metadata: { agency_id: agency.id },
    success_url: `${input.returnUrl}${sep}billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.returnUrl}${sep}billing=cancelled`,
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

/** Stripe's billing portal: change plan, update card, invoices, cancel */
export async function createBillingPortalSession(agencyId: string, returnUrl: string): Promise<string> {
  const agency = await loadAgency(agencyId);
  if (!agency.stripe_customer_id) throw new Error('This agency has no billing account yet');
  const session = await getStripe().billingPortal.sessions.create({
    customer: agency.stripe_customer_id,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Mirrors a subscription onto its agency. Always re-reads it from Stripe:
 * events arrive late and out of order, so an event's copy is never trusted.
 * The agency is found by the subscription's customer.
 */
export async function syncSubscription(subscriptionId: string, source: string): Promise<void> {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const { data: agency } = await supabase
    .from('agencies')
    .select('id, stripe_subscription_id, subscription_status, subscription_past_due_since')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (!agency) {
    console.warn('Billing: no agency for customer', customerId, subscriptionId, source);
    return;
  }

  // An agency has one subscription at a time. A stale event for an older,
  // ended one must not replace the current one.
  const ended = sub.status === 'canceled' || sub.status === 'incomplete_expired';
  if (agency.stripe_subscription_id && agency.stripe_subscription_id !== sub.id && ended) {
    console.log('Billing: ignoring ended subscription', sub.id, 'for agency', agency.id, source);
    return;
  }

  const item = sub.items.data[0];
  const priceKey = item?.price.lookup_key ?? null;
  const info = priceKeyInfo(priceKey);
  const pastDueSince = sub.status === 'past_due'
    ? agency.subscription_past_due_since ?? new Date().toISOString()
    : null;
  const iso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null);

  const { error } = await supabase
    .from('agencies')
    .update({
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      subscription_price: priceKey,
      subscription_current_period_end: iso(item?.current_period_end),
      subscription_trial_end: iso(sub.trial_end),
      subscription_cancel_at_period_end: sub.cancel_at_period_end || !!sub.cancel_at,
      subscription_past_due_since: pastDueSince,
      subscription_start_date: iso(sub.start_date),
      subscription_end_date: iso(sub.ended_at ?? sub.cancel_at),
      subscription_synced_at: new Date().toISOString(),
      // The plan follows what they pay for; an ended subscription falls back
      // to Essentials (its booking page is closed anyway)
      plan: ended ? 'essentials' : info?.plan ?? 'essentials',
    })
    .eq('id', agency.id);
  if (error) throw new Error(`Billing sync failed for ${agency.id}: ${error.message}`);
  console.log('✅ Billing synced', { agency: agency.id, subscription: sub.id, status: sub.status, price: priceKey, source });
}

/** After Checkout: sync without waiting for the webhook. Checks the session is this agency's. */
export async function syncFromCheckoutSession(sessionId: string, agencyId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== agencyId || session.mode !== 'subscription') return;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (subscriptionId) await syncSubscription(subscriptionId, `checkout ${session.id}`);
}

/** The subscription id an invoice or other billing object belongs to */
export function subscriptionIdOf(object: Stripe.Invoice | Stripe.Subscription | Stripe.Checkout.Session): string | null {
  if (object.object === 'subscription') return object.id;
  if (object.object === 'checkout.session') {
    return typeof object.subscription === 'string' ? object.subscription : object.subscription?.id ?? null;
  }
  // Invoices (basil API): the subscription moved under parent
  const fromParent = object.parent?.subscription_details?.subscription;
  return typeof fromParent === 'string' ? fromParent : fromParent?.id ?? null;
}
