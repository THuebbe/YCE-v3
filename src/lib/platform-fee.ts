// The platform's booking fee rule. No server dependencies: shared code (the
// readiness check) uses it as well as checkout. lib/stripe re-exports it.

/** 'express' = turnkey plan ($3/booking), not Stripe's Express account type. */
export type StripeAccountType = 'express' | 'standard';

/**
 * Platform fee per booking, in cents. Express (turnkey) agencies pay a flat
 * $3 per booking (PRODUCT.md, decided 2026-10-10); agencies on their own
 * Stripe (Standard) pay none.
 */
export function applicationFeeCents(accountType: StripeAccountType | null | undefined): number {
  return accountType === 'express' ? 300 : 0;
}

/**
 * Lowest booking total the turnkey plan can charge: the $3 fee comes out of
 * the payment, and Stripe refuses a fee larger than the charge (and the
 * agency's card processing comes out too). Own-Stripe agencies pay no fee.
 */
export const MIN_TOTAL_WITH_FEE_DOLLARS = 5;

/** Whether a booking total can carry this account type's platform fee */
export function totalCoversFee(totalCents: number, accountType: StripeAccountType | null | undefined): boolean {
  return applicationFeeCents(accountType) === 0 || totalCents >= MIN_TOTAL_WITH_FEE_DOLLARS * 100;
}
