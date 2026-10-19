/**
 * Agency subscriptions: prices and the "is this agency paid up" rule
 * (PRODUCT.md "Billing", DECIDED 2026-10-19). Shared by server and client;
 * the Stripe calls are in stripe-billing.ts.
 */
import type { Plan } from './entitlements';

export type BillingInterval = 'month' | 'year';

/**
 * Stripe price lookup keys. The code never holds price ids, so test and live
 * mode each just need prices created with these keys (STATE.md runbook).
 */
export const PRICE_KEYS: Record<Plan, Record<BillingInterval, string>> = {
  essentials: { month: 'yce_essentials_monthly', year: 'yce_essentials_annual' },
  elite: { month: 'yce_elite_monthly', year: 'yce_elite_annual' },
};

/** For display only - Stripe's price is what's charged */
export const PLAN_PRICES: Record<Plan, Record<BillingInterval, number>> = {
  essentials: { month: 49, year: 499 },
  elite: { month: 79, year: 799 },
};

export function priceKeyInfo(key: string | null | undefined): { plan: Plan; interval: BillingInterval } | null {
  for (const plan of Object.keys(PRICE_KEYS) as Plan[]) {
    for (const interval of ['month', 'year'] as BillingInterval[]) {
      if (PRICE_KEYS[plan][interval] === key) return { plan, interval };
    }
  }
  return null;
}

/** Days an agency keeps taking bookings after a renewal payment fails */
export const GRACE_DAYS = 7;

/** The subscription columns on `agencies` (migration 20261019_agency_subscriptions) */
export interface AgencySubscription {
  stripe_subscription_id?: string | null;
  subscription_status?: string | null; // a Stripe status, or 'none'
  subscription_price?: string | null;
  subscription_current_period_end?: string | null;
  subscription_trial_end?: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  subscription_past_due_since?: string | null;
}

/** When a past-due agency's booking page closes */
export function graceEndsAt(sub: AgencySubscription): Date | null {
  if (sub.subscription_status !== 'past_due' || !sub.subscription_past_due_since) return null;
  return new Date(new Date(sub.subscription_past_due_since).getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Whether the agency's booking page takes bookings. An unpaid agency
 * (never subscribed, cancelled, or past due beyond the grace) is closed to
 * new bookings; its dashboard and existing orders are untouched.
 */
export function subscriptionAllowsBookings(sub: AgencySubscription, now: Date = new Date()): boolean {
  if (!sub.stripe_subscription_id) return false;
  switch (sub.subscription_status) {
    case 'trialing':
    case 'active':
      return true;
    case 'past_due': {
      const ends = graceEndsAt(sub);
      // No start recorded yet (sync lag): give the benefit of the doubt
      return !ends || now < ends;
    }
    default: // canceled, unpaid, incomplete, incomplete_expired, paused, none
      return false;
  }
}

/** Has (or had) a subscription that isn't over: send to the billing portal, not a new checkout */
export function hasLiveSubscription(sub: AgencySubscription): boolean {
  return !!sub.stripe_subscription_id
    && ['trialing', 'active', 'past_due', 'unpaid', 'incomplete', 'paused'].includes(sub.subscription_status ?? '');
}
