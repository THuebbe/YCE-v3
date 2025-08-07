'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/db/supabase-client';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function createStripeConnectAccount() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return { success: false, error: 'User not found' };
    }

    if (!user || !user.agency) {
      return { success: false, error: 'Agency not found' };
    }

    // Check if agency already has a Stripe account
    if (user.agency.stripeAccountId) {
      // If account exists but onboarding is not complete, return existing onboarding URL
      if (user.agency.stripeOnboardingUrl && !user.agency.stripeDetailsSubmitted) {
        return { 
          success: true, 
          onboardingUrl: user.agency.stripeOnboardingUrl,
          accountId: user.agency.stripeAccountId 
        };
      }
      
      // If account is fully set up
      if (user.agency.stripeDetailsSubmitted) {
        return { 
          success: true, 
          message: 'Stripe account already connected',
          accountId: user.agency.stripeAccountId 
        };
      }
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'US',
      email: user.email,
      business_profile: {
        name: user.agency.name,
        url: user.agency.domain || `https://${user.agency.slug}.yardcardelite.com`,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/payments?success=true`,
      type: 'account_onboarding',
    });

    // Update agency with Stripe account info
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending',
        stripeOnboardingUrl: accountLink.url,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      })
      .eq('id', user.agency.id);

    if (updateError) {
      console.error('Error updating agency:', updateError);
      return { success: false, error: 'Failed to update agency' };
    }

    return { 
      success: true, 
      onboardingUrl: accountLink.url,
      accountId: account.id 
    };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return { 
      success: false, 
      error: 'Failed to create Stripe Connect account' 
    };
  }
}

export async function getStripeConnectStatus() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw new Error('User not found');
    }

    if (!user || !user.agency) {
      throw new Error('Agency not found');
    }

    const agency = user.agency;

    // If no Stripe account exists
    if (!agency.stripeAccountId) {
      return {
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    // Get latest account info from Stripe
    const account = await stripe.accounts.retrieve(agency.stripeAccountId);

    // Update local database with latest info
    await supabase
      .from('agencies')
      .update({
        stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
      })
      .eq('id', agency.id);

    // If account is not fully set up, create new onboarding link
    let onboardingUrl: string | undefined;
    if (!account.details_submitted) {
      const accountLink = await stripe.accountLinks.create({
        account: agency.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/payments?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/payments?success=true`,
        type: 'account_onboarding',
      });
      
      onboardingUrl = accountLink.url;
      
      // Update onboarding URL in database
      await supabase
        .from('agencies')
        .update({ stripeOnboardingUrl: onboardingUrl })
        .eq('id', agency.id);
    }

    return {
      hasAccount: true,
      accountId: agency.stripeAccountId,
      accountStatus: account.charges_enabled ? 'enabled' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingUrl,
    };
  } catch (error) {
    console.error('Error getting Stripe Connect status:', error);
    throw error;
  }
}

export async function refreshStripeAccount() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const status = await getStripeConnectStatus();
    
    return { success: true, status };
  } catch (error) {
    console.error('Error refreshing Stripe account:', error);
    return { 
      success: false, 
      error: 'Failed to refresh account status' 
    };
  }
}