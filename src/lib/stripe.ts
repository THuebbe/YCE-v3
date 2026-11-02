// Server only: never import this from a 'use client' file.
import Stripe from 'stripe';
import { headers } from 'next/headers';

/**
 * The platform's Stripe client (server only). Booking payments are DIRECT
 * charges on the agency's connected account: pass `{ stripeAccount }` as the
 * request option on every call that touches a booking payment.
 */
let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' });
  return client;
}

// The fee rule has no server dependencies, so shared code can use it too
export { applicationFeeCents, MIN_TOTAL_WITH_FEE_DOLLARS, totalCoversFee, type StripeAccountType } from './platform-fee';

/** Dollars (as stored on orders and in pricing_config) to Stripe cents. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * This deployment's own origin, from the request (previews have their own
 * URLs, and NEXT_PUBLIC_APP_URL isn't set in Vercel). Used for the URLs
 * Stripe sends people back to.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  if (host) return `${h.get('x-forwarded-proto') || 'https'}://${host}`;
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
