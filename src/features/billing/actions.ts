'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserById } from '@/lib/db/supabase-client';
import { requestOrigin } from '@/lib/stripe';
import { createBillingPortalSession, createSubscriptionCheckout } from './stripe-billing';
import { hasLiveSubscription, type BillingInterval } from './subscription';
import type { Plan } from './entitlements';

type UrlResult = { success: true; url: string } | { success: false; error: string };

const ADMIN_ROLES = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN'];

/**
 * Billing is for the signed-in user's OWN agency, and admins only (same
 * rule as the settings page). The agency never comes from the browser.
 */
async function requireBillingAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Please sign in again');
  const user = await getUserById(userId);
  if (!user?.agency_id || !user.agency) throw new Error('No agency for this account');
  if (!ADMIN_ROLES.includes(user.role)) throw new Error('Only agency admins can manage billing');
  return user as { email: string | null; agency_id: string; agency: Record<string, any> };
}

async function settingsUrl(slug: string) {
  return `${await requestOrigin()}/${slug}/settings`;
}

export async function startSubscription(plan: Plan, interval: BillingInterval): Promise<UrlResult> {
  try {
    if (!['essentials', 'elite'].includes(plan) || !['month', 'year'].includes(interval)) {
      return { success: false, error: 'Unknown plan' };
    }
    const user = await requireBillingAdmin();
    if (hasLiveSubscription(user.agency)) {
      return { success: false, error: 'You already have a subscription - use Manage billing to change it' };
    }
    const url = await createSubscriptionCheckout({
      agencyId: user.agency_id,
      plan,
      interval,
      email: user.email,
      returnUrl: await settingsUrl(user.agency.slug),
    });
    return { success: true, url };
  } catch (error) {
    console.error('startSubscription failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Could not start checkout' };
  }
}

export async function openBillingPortal(): Promise<UrlResult> {
  try {
    const user = await requireBillingAdmin();
    const url = await createBillingPortalSession(user.agency_id, await settingsUrl(user.agency.slug));
    return { success: true, url };
  } catch (error) {
    console.error('openBillingPortal failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Could not open billing' };
  }
}
