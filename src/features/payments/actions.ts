'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase, getUserById } from '@/lib/db/supabase-client';
import { getStripe, requestOrigin, type StripeAccountType } from '@/lib/stripe';
import type Stripe from 'stripe';

/**
 * Stripe Connect for agencies. Customer money always goes straight to the
 * agency (direct charges); see PRODUCT.md "Payments".
 * - express: turnkey. Stripe-hosted signup from inside our app; $3 platform
 *   fee per booking. The agency manages it in the Express dashboard.
 *   (Created with controller properties, not the legacy type: 'express'.)
 * - standard: the agency's own full Stripe account; no per-booking fee.
 */

/** The signed-in member's agency (RLS is off: everything below is scoped to it). */
async function currentAgency() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await getUserById(userId);
  if (!user?.agency) throw new Error('Agency not found');
  return user.agency as {
    id: string; slug: string; name: string; domain?: string | null; email?: string | null;
    stripe_account_id: string | null; stripe_account_type: StripeAccountType | null;
    stripe_details_submitted: boolean | null;
  } & { userEmail?: string };
}

async function onboardingLink(accountId: string, slug: string) {
  const origin = await requestOrigin();
  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/${slug}/settings?refresh=true`,
    return_url: `${origin}/${slug}/settings?success=true`,
    type: 'account_onboarding',
  });
  return link.url;
}

/**
 * The turnkey ("Set it up for me") account, created with Accounts v2 because
 * v1 can't combine these (Stripe rejects Express Dashboard + Stripe-managed
 * risk on v1, and legacy type: 'express' bills Stripe's fees to the platform):
 * - Express Dashboard (login links from Settings)
 * - Stripe liable for losses ("Managed Risk", needs direct charges - we use them)
 * - Stripe's processing fee charged to the agency, so the booking's
 *   application_fee_amount is only our $3
 * The id is a normal acct_..., used with v1 account links, PaymentIntents
 * (Stripe-Account) and login links like any other.
 */
async function createExpressAccount(agency: Awaited<ReturnType<typeof currentAgency>>): Promise<string> {
  const account = await getStripe().rawRequest('POST', '/v2/core/accounts', {
    display_name: agency.name,
    ...(agency.email ? { contact_email: agency.email } : {}),
    identity: { country: 'us' },
    dashboard: 'express',
    defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
    configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
    metadata: { yce_agency_id: agency.id, yce_agency_slug: agency.slug },
  }, {
    // Accounts v2 is a preview API on our pinned (basil) version; only this
    // call opts in. Re-check before going live - previews can change.
    apiVersion: '2025-07-30.preview',
  }) as unknown as { id: string };
  return account.id;
}

/**
 * Starts (or resumes) Stripe onboarding for the member's agency and returns
 * the Stripe-hosted onboarding URL. `type` only matters for a new account;
 * an agency that already has one continues with it.
 */
export async function createStripeConnectAccount(type: StripeAccountType = 'express') {
  try {
    const agency = await currentAgency();
    const stripe = getStripe();

    if (agency.stripe_account_id) {
      const account = await stripe.accounts.retrieve(agency.stripe_account_id);
      if (account.details_submitted) {
        return { success: true, message: 'Stripe account already connected', accountId: account.id };
      }
      return { success: true, onboardingUrl: await onboardingLink(account.id, agency.slug), accountId: account.id };
    }

    const businessProfile = {
      name: agency.name,
      ...(agency.domain ? { url: agency.domain } : {}),
      product_description: 'Yard sign display rentals',
    };
    const accountId = type === 'express'
      ? await createExpressAccount(agency)
      : (await stripe.accounts.create({
          type: 'standard',
          country: 'US',
          email: agency.email || undefined,
          business_profile: businessProfile,
          metadata: { yce_agency_id: agency.id, yce_agency_slug: agency.slug },
        })).id;

    const { error } = await supabase
      .from('agencies')
      .update({
        stripe_account_id: accountId,
        stripe_account_type: type,
        stripe_account_status: 'pending',
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_details_submitted: false,
      })
      .eq('id', agency.id);
    if (error) {
      console.error('Saving the new Stripe account failed:', agency.id, accountId, error.message);
      return { success: false, error: 'Could not save your Stripe account. Please try again.' };
    }

    return { success: true, onboardingUrl: await onboardingLink(accountId, agency.slug), accountId };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    // Stripe's own reason (e.g. Express not enabled for the platform) helps the operator
    const message = (error as Stripe.errors.StripeError)?.message;
    return { success: false, error: message ? `Stripe: ${message}` : 'Failed to start Stripe setup' };
  }
}

/** Live status from Stripe, mirrored into agencies.* for the booking page. */
export async function getStripeConnectStatus() {
  const agency = await currentAgency();
  if (!agency.stripe_account_id) {
    return { hasAccount: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
  }
  try {
    const account = await getStripe().accounts.retrieve(agency.stripe_account_id);
    await supabase
      .from('agencies')
      .update({
        stripe_account_status: account.charges_enabled ? 'enabled' : 'pending',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
      })
      .eq('id', agency.id);
    return {
      hasAccount: true,
      accountId: account.id,
      accountType: agency.stripe_account_type ?? (account.type as StripeAccountType),
      accountStatus: account.charges_enabled ? 'enabled' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      currentlyDue: account.requirements?.currently_due ?? [],
    };
  } catch (error) {
    console.error('Stripe status check failed, using saved status:', error);
    const { data } = await supabase
      .from('agencies')
      .select('stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
      .eq('id', agency.id)
      .single();
    return {
      hasAccount: true,
      accountId: agency.stripe_account_id,
      accountType: agency.stripe_account_type,
      accountStatus: data?.stripe_account_status || 'pending',
      chargesEnabled: !!data?.stripe_charges_enabled,
      payoutsEnabled: !!data?.stripe_payouts_enabled,
      detailsSubmitted: !!data?.stripe_details_submitted,
      currentlyDue: [] as string[],
    };
  }
}

export async function refreshStripeAccount() {
  try {
    return { success: true, status: await getStripeConnectStatus() };
  } catch (error) {
    console.error('Error refreshing Stripe account:', error);
    return { success: false, error: 'Failed to refresh account status' };
  }
}

/**
 * Where the agency manages payouts and sees payments (and the $3 fee on
 * Express): a one-time sign-in link to the Express dashboard, or the full
 * Stripe dashboard for Standard accounts.
 */
export async function createStripeDashboardLink() {
  try {
    const agency = await currentAgency();
    if (!agency.stripe_account_id) return { success: false, error: 'Stripe is not connected yet' };
    if (agency.stripe_account_type === 'express') {
      const link = await getStripe().accounts.createLoginLink(agency.stripe_account_id);
      return { success: true, url: link.url };
    }
    return { success: true, url: 'https://dashboard.stripe.com/' };
  } catch (error) {
    console.error('Error creating Stripe dashboard link:', error);
    return { success: false, error: 'Could not open your Stripe dashboard' };
  }
}
