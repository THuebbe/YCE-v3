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
    if (user.agency.stripe_account_id) {
      // If account exists but onboarding is not complete, return existing onboarding URL
      if (user.agency.stripe_onboarding_url && !user.agency.stripe_details_submitted) {
        return { 
          success: true, 
          onboardingUrl: user.agency.stripe_onboarding_url,
          accountId: user.agency.stripe_account_id 
        };
      }
      
      // If account is fully set up
      if (user.agency.stripe_details_submitted) {
        return { 
          success: true, 
          message: 'Stripe account already connected',
          accountId: user.agency.stripe_account_id 
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
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${user.agency.slug}/settings?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${user.agency.slug}/settings?success=true`,
      type: 'account_onboarding',
    });

    // Update agency with Stripe account info
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        stripe_onboarding_url: accountLink.url,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_details_submitted: false,
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
    console.log('💳 Getting Stripe Connect status...')
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Stripe status check failed: No user ID')
      throw new Error('Unauthorized');
    }
    
    console.log('💳 Stripe status check for user:', userId)

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
      console.error('❌ Error fetching user for Stripe status:', userError);
      throw new Error('User not found');
    }

    if (!user || !user.agency) {
      console.error('❌ User or agency not found in Stripe status check:', { user: !!user, agency: !!user?.agency });
      throw new Error('Agency not found');
    }

    const agency = user.agency;
    console.log('💳 Agency found for Stripe status check:', { 
      id: agency.id, 
      slug: agency.slug,
      hasStripeAccount: !!agency.stripe_account_id 
    });

    // If no Stripe account exists
    if (!agency.stripe_account_id) {
      console.log('💳 No Stripe account ID found for agency');
      return {
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    // Get latest account info from Stripe with retry logic
    console.log('💳 Fetching account details from Stripe API for account:', agency.stripe_account_id);
    let account: Stripe.Account | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        account = await stripe.accounts.retrieve(agency.stripe_account_id);
        console.log('💳 Stripe account retrieved (attempt', retryCount + 1, '):', {
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted
        });
        break;
      } catch (stripeError) {
        retryCount++;
        console.error(`❌ Stripe API error (attempt ${retryCount}/${maxRetries}):`, stripeError);
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to fetch Stripe account after ${maxRetries} attempts: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    // Ensure account was retrieved
    if (!account) {
      throw new Error('Failed to retrieve Stripe account after all retries');
    }

    // Update local database with latest info
    console.log('💳 Updating local database with Stripe account status...');
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        stripe_account_status: account.charges_enabled ? 'enabled' : 'pending',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
      })
      .eq('id', agency.id);

    if (updateError) {
      console.error('❌ Error updating agency Stripe status in database:', updateError);
    } else {
      console.log('✅ Successfully updated agency Stripe status in database');
    }

    // If account is not fully set up, create new onboarding link
    let onboardingUrl: string | undefined;
    if (!account.details_submitted) {
      const accountLink = await stripe.accountLinks.create({
        account: agency.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${agency.slug}/settings?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${agency.slug}/settings?success=true`,
        type: 'account_onboarding',
      });
      
      onboardingUrl = accountLink.url;
      
      // Update onboarding URL in database
      await supabase
        .from('agencies')
        .update({ stripe_onboarding_url: onboardingUrl })
        .eq('id', agency.id);
    }

    return {
      hasAccount: true,
      accountId: agency.stripe_account_id,
      accountStatus: account.charges_enabled ? 'enabled' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingUrl,
    };
  } catch (error) {
    console.error('❌ Error getting Stripe Connect status:', error);
    
    // Fallback: return cached status from database if Stripe API fails
    try {
      console.log('🔄 Falling back to cached database status...');
      const { data: user } = await supabase
        .from('users')
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq('id', (await auth()).userId!)
        .single();
        
      if (user?.agency) {
        const cachedStatus = {
          hasAccount: !!user.agency.stripe_account_id,
          accountId: user.agency.stripe_account_id,
          accountStatus: user.agency.stripe_account_status || 'pending',
          chargesEnabled: user.agency.stripe_charges_enabled || false,
          payoutsEnabled: user.agency.stripe_payouts_enabled || false,
          detailsSubmitted: user.agency.stripe_details_submitted || false,
        };
        console.log('✅ Using cached status from database:', cachedStatus);
        return cachedStatus;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
    
    throw error;
  }
}

export async function refreshStripeAccount() {
  try {
    console.log('🔄 Refreshing Stripe account status...');
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Refresh failed: No user ID');
      return { success: false, error: 'Unauthorized' };
    }

    const status = await getStripeConnectStatus();
    console.log('✅ Stripe account status refreshed successfully:', {
      hasAccount: status.hasAccount,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled
    });
    
    return { success: true, status };
  } catch (error) {
    console.error('❌ Error refreshing Stripe account:', error);
    return { 
      success: false, 
      error: 'Failed to refresh account status' 
    };
  }
}