/**
 * Whether an agency can take bookings, and what's missing if not
 * (PRODUCT.md "Setup checklist": inventory and payments gate bookings, plus
 * a paid-up plan). Shared: the booking page, holds and order creation
 * refuse on it, and the dashboard checklist shows it.
 */
import { subscriptionAllowsBookings, type AgencySubscription } from '@/features/billing/subscription';
import { parseBookingPricing, parseSalesTax } from '@/features/booking/pricing';
import { totalCoversFee, type StripeAccountType } from '@/lib/platform-fee';

export type ReadinessItem = 'plan' | 'payments' | 'inventory' | 'pricing' | 'tax';

/** Checklist order */
export const READINESS_ITEMS: ReadinessItem[] = ['plan', 'payments', 'inventory', 'pricing', 'tax'];

export interface ReadinessAgency extends AgencySubscription {
  pricing_config?: unknown;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_account_type?: string | null; // a StripeAccountType, as stored
}

/**
 * Card payments through Stripe are the only way customers can pay online
 * today. PayPal checkout (with Venmo inside it) counts once it's built
 * (docs/features/VENMO-PAYPAL.md).
 */
export function canTakePayments(agency: ReadinessAgency): boolean {
  return !!(agency.stripe_account_id && agency.stripe_charges_enabled);
}

/** What's missing, in the order the checklist shows it. Empty = taking bookings. */
export function bookingBlockers(agency: ReadinessAgency, hasInventory: boolean): ReadinessItem[] {
  const missing: ReadinessItem[] = [];
  if (!subscriptionAllowsBookings(agency)) missing.push('plan');
  if (!canTakePayments(agency)) missing.push('payments');
  if (!hasInventory) missing.push('inventory');
  // Prices set, and (turnkey plan) high enough to carry the $3 booking fee
  const pricing = parseBookingPricing(agency.pricing_config);
  if (!pricing || !totalCoversFee(Math.round(pricing.basePrice * 100), agency.stripe_account_type as StripeAccountType | null | undefined)) missing.push('pricing');
  // An explicit answer, even "I don't charge sales tax" (owner, 2026-11-07)
  if (!parseSalesTax(agency.pricing_config)) missing.push('tax');
  return missing;
}
