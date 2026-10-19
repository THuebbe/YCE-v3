/**
 * Whether an agency can take bookings, and what's missing if not
 * (PRODUCT.md "Setup checklist": inventory and payments gate bookings, plus
 * a paid-up plan). Shared: the booking page, holds and order creation
 * refuse on it, and the dashboard checklist shows it.
 */
import { subscriptionAllowsBookings, type AgencySubscription } from '@/features/billing/subscription';
import { parseBookingPricing } from '@/features/booking/pricing';

export type ReadinessItem = 'plan' | 'payments' | 'inventory' | 'pricing';

export interface ReadinessAgency extends AgencySubscription {
  pricing_config?: unknown;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
}

/**
 * Card payments through Stripe are the only way customers can pay online
 * today. Venmo and PayPal checkout aren't finished (STATE.md), so they
 * don't count until they are.
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
  if (!parseBookingPricing(agency.pricing_config)) missing.push('pricing');
  return missing;
}
