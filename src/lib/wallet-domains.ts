// Server only: never import this from a 'use client' file.
import { getStripe } from './stripe';
import { SITE_HOST } from './site';

/**
 * Apple Pay and Google Pay show in Stripe's payment form only on web domains
 * registered to the account that takes the charge. Booking payments are
 * direct charges on the agency's own Stripe account, so every agency's
 * account needs our domains registered (Stripe: "Connect platforms that
 * create direct charges must use the API to manage domains for their
 * connected accounts").
 */

/** The site's host and its www twin, plus the host this page was served from (previews, the demo site) */
export function walletHosts(siteHost: string, requestHost?: string | null): string[] {
  // Only real domain names: localhost and IP addresses can't be registered
  const registrable = (h: string) => h.includes('.') && !/^[\d.]+$/.test(h);
  const bare = siteHost.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
  const hosts = new Set(registrable(bare) ? [bare, `www.${bare}`] : []);
  const req = requestHost?.toLowerCase().replace(/:\d+$/, '');
  if (req && registrable(req)) hosts.add(req);
  return [...hosts];
}

// Per server instance: accounts already checked, so a page view costs no API call
const done = new Set<string>();

/**
 * Registers any missing domains on the agency's Stripe account. Safe to call
 * often (once per account per server instance does any work) and never
 * throws: wallets are a convenience, cards work without them.
 */
export async function ensureWalletDomains(stripeAccountId: string, requestHost?: string | null): Promise<void> {
  const hosts = walletHosts(SITE_HOST, requestHost);
  const key = `${stripeAccountId}:${hosts.join(',')}`;
  if (done.has(key)) return;
  try {
    const stripe = getStripe();
    const existing = await stripe.paymentMethodDomains.list({ limit: 100 }, { stripeAccount: stripeAccountId });
    const have = new Set(existing.data.map(d => d.domain_name));
    for (const host of hosts) {
      if (have.has(host)) continue;
      const domain = await stripe.paymentMethodDomains.create({ domain_name: host }, { stripeAccount: stripeAccountId });
      console.log('Wallet domain registered', stripeAccountId, host, {
        applePay: domain.apple_pay?.status,
        googlePay: domain.google_pay?.status,
      });
    }
    done.add(key);
  } catch (error) {
    // Not retried on every page view; the next server instance or the
    // account's next Stripe update tries again
    done.add(key);
    console.warn('Wallet domain registration failed (cards still work):', stripeAccountId, (error as Error)?.message);
  }
}
