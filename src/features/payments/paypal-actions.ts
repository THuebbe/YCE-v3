'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/db/supabase-client';

// PayPal Partner Referrals API configuration
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// PayPal API utilities
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalPartnerReferral() {
  try {
    console.log('🏦 Creating PayPal Partner Referral...');
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

    // Check if agency already has a PayPal account
    if (user.agency.paypalAccountId) {
      // If account exists but onboarding is not complete, return existing onboarding URL
      if (user.agency.paypalOnboardingUrl && !user.agency.paypalDetailsSubmitted) {
        return { 
          success: true, 
          onboardingUrl: user.agency.paypalOnboardingUrl,
          accountId: user.agency.paypalAccountId 
        };
      }
      
      // If account is fully set up
      if (user.agency.paypalDetailsSubmitted) {
        return { 
          success: true, 
          message: 'PayPal account already connected',
          accountId: user.agency.paypalAccountId 
        };
      }
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Generate unique tracking ID for this referral
    const trackingId = `yardcard-${user.agency.id}-${Date.now()}`;

    // Create Partner Referrals request
    const partnerReferralPayload = {
      tracking_id: trackingId,
      operations: [
        {
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: {
              integration_method: 'PAYPAL',
              integration_type: 'THIRD_PARTY',
              third_party_details: {
                features: ['PAYMENT', 'REFUND']
              }
            }
          }
        }
      ],
      products: ['EXPRESS_CHECKOUT'],
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true
        }
      ],
      partner_config_override: {
        partner_logo_url: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${user.agency.slug}/settings?paypal_success=true`,
        return_url_description: 'Return to YardCard Elite dashboard',
        action_renewal_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${user.agency.slug}/settings?paypal_refresh=true`
      }
    };

    // Call PayPal Partner Referrals API
    const referralResponse = await fetch(`${PAYPAL_BASE_URL}/v2/customer/partner-referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID || 'YardCardElite_Cart_PPCP'
      },
      body: JSON.stringify(partnerReferralPayload)
    });

    if (!referralResponse.ok) {
      const errorData = await referralResponse.text();
      console.error('PayPal Partner Referrals API error:', errorData);
      throw new Error(`PayPal API error: ${referralResponse.status}`);
    }

    const referralData = await referralResponse.json();
    console.log('🏦 PayPal Partner Referral created:', { 
      trackingId, 
      hasActionUrl: !!referralData.links?.find((l: any) => l.rel === 'action_url') 
    });

    // Get the action URL for seller onboarding
    const actionUrl = referralData.links?.find((l: any) => l.rel === 'action_url')?.href;
    
    if (!actionUrl) {
      throw new Error('No action URL returned from PayPal');
    }

    // Update agency with PayPal referral info
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        paypalAccountStatus: 'pending',
        paypalOnboardingUrl: actionUrl,
        paypalPermissionsGranted: false,
        paypalEmailConfirmed: false,
        paypalPaymentsReceivable: false,
        paypalDetailsSubmitted: false,
        paypalIntegrationData: JSON.stringify({ 
          trackingId,
          referralId: referralData.partner_referral_id 
        }),
        paypalLastSyncAt: new Date().toISOString()
      })
      .eq('id', user.agency.id);

    if (updateError) {
      console.error('Error updating agency:', updateError);
      return { success: false, error: 'Failed to update agency' };
    }

    return { 
      success: true, 
      onboardingUrl: actionUrl,
      trackingId 
    };
  } catch (error) {
    console.error('Error creating PayPal Partner Referral:', error);
    return { 
      success: false, 
      error: 'Failed to create PayPal integration' 
    };
  }
}

export async function processPayPalCallback(authCode: string, sharedId: string) {
  try {
    console.log('🏦 Processing PayPal callback...');
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

    if (userError || !user?.agency) {
      return { success: false, error: 'Agency not found' };
    }

    // Get seller access token using authCode and sharedId
    const accessToken = await getPayPalAccessToken();
    
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&code=${authCode}`,
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange auth code for access token');
    }

    const tokenData = await tokenResponse.json();

    // Update agency with auth info
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        paypalAccountId: sharedId,
        paypalAuthCode: authCode,
        paypalSharedId: sharedId,
        paypalAccountStatus: 'connected',
        paypalPermissionsGranted: true, // Permissions granted by completing OAuth flow
        paypalLastSyncAt: new Date().toISOString()
      })
      .eq('id', user.agency.id);

    if (updateError) {
      console.error('Error updating agency with PayPal callback:', updateError);
      return { success: false, error: 'Failed to save PayPal connection' };
    }

    // Now get the full seller status
    const status = await getPayPalConnectStatus();
    
    return { 
      success: true, 
      accountId: sharedId,
      status
    };
  } catch (error) {
    console.error('Error processing PayPal callback:', error);
    return { 
      success: false, 
      error: 'Failed to process PayPal connection' 
    };
  }
}

export async function getPayPalConnectStatus() {
  try {
    console.log('🏦 Getting PayPal Connect status...');
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

    if (userError || !user?.agency) {
      throw new Error('Agency not found');
    }

    const agency = user.agency;
    console.log('🏦 Agency found for PayPal status check:', { 
      id: agency.id, 
      slug: agency.slug,
      hasPayPalAccount: !!agency.paypalAccountId 
    });

    // If no PayPal account exists
    if (!agency.paypalAccountId) {
      console.log('🏦 No PayPal account ID found for agency');
      return {
        accountId: null,
        isConnected: false,
        hasCompletedOnboarding: false,
        permissionsGranted: false,
        emailConfirmed: false,
        paymentsReceivable: false,
        detailsSubmitted: false,
        authCode: null,
        sharedId: null,
        lastSyncAt: null,
      };
    }

    // For agencies with PayPal accounts, check seller integration status
    // Note: This requires the Partner ID and merchant integration API
    let sellerStatus = null;
    
    try {
      const accessToken = await getPayPalAccessToken();
      const partnerId = process.env.PAYPAL_PARTNER_ID;
      
      if (partnerId) {
        const statusResponse = await fetch(
          `${PAYPAL_BASE_URL}/v1/customer/partners/${partnerId}/merchant-integrations/${agency.paypalAccountId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (statusResponse.ok) {
          sellerStatus = await statusResponse.json();
          console.log('🏦 PayPal seller status retrieved:', {
            paymentsReceivable: sellerStatus.payments_receivable,
            emailConfirmed: sellerStatus.primary_email_confirmed
          });

          // Update database with latest status
          await supabase
            .from('agencies')
            .update({
              paypalEmailConfirmed: sellerStatus.primary_email_confirmed || false,
              paypalPaymentsReceivable: sellerStatus.payments_receivable || false,
              paypalDetailsSubmitted: (sellerStatus.payments_receivable && sellerStatus.primary_email_confirmed) || false,
              paypalLastSyncAt: new Date().toISOString()
            })
            .eq('id', agency.id);
        }
      }
    } catch (apiError) {
      console.warn('⚠️ Could not fetch PayPal seller status from API, using cached data:', apiError);
    }

    // Return status (using API data if available, otherwise cached database data)
    return {
      accountId: agency.paypalAccountId,
      isConnected: !!agency.paypalAccountId,
      hasCompletedOnboarding: agency.paypalDetailsSubmitted || (sellerStatus?.payments_receivable && sellerStatus?.primary_email_confirmed),
      permissionsGranted: agency.paypalPermissionsGranted || false,
      emailConfirmed: agency.paypalEmailConfirmed || sellerStatus?.primary_email_confirmed || false,
      paymentsReceivable: agency.paypalPaymentsReceivable || sellerStatus?.payments_receivable || false,
      detailsSubmitted: agency.paypalDetailsSubmitted || false,
      authCode: agency.paypalAuthCode,
      sharedId: agency.paypalSharedId,
      lastSyncAt: agency.paypalLastSyncAt,
      integrationData: agency.paypalIntegrationData,
    };
  } catch (error) {
    console.error('❌ Error getting PayPal Connect status:', error);
    
    // Fallback: return cached status from database if API fails
    try {
      console.log('🔄 Falling back to cached PayPal database status...');
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
          accountId: user.agency.paypalAccountId,
          isConnected: !!user.agency.paypalAccountId,
          hasCompletedOnboarding: user.agency.paypalDetailsSubmitted || false,
          permissionsGranted: user.agency.paypalPermissionsGranted || false,
          emailConfirmed: user.agency.paypalEmailConfirmed || false,
          paymentsReceivable: user.agency.paypalPaymentsReceivable || false,
          detailsSubmitted: user.agency.paypalDetailsSubmitted || false,
          authCode: user.agency.paypalAuthCode,
          sharedId: user.agency.paypalSharedId,
          lastSyncAt: user.agency.paypalLastSyncAt,
          integrationData: user.agency.paypalIntegrationData,
        };
        console.log('✅ Using cached PayPal status from database:', cachedStatus);
        return cachedStatus;
      }
    } catch (fallbackError) {
      console.error('❌ PayPal fallback also failed:', fallbackError);
    }
    
    throw error;
  }
}

export async function refreshPayPalAccount() {
  try {
    console.log('🔄 Refreshing PayPal account status...');
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ PayPal refresh failed: No user ID');
      return { success: false, error: 'Unauthorized' };
    }

    const status = await getPayPalConnectStatus();
    console.log('✅ PayPal account status refreshed successfully:', {
      isConnected: status.isConnected,
      permissionsGranted: status.permissionsGranted,
      paymentsReceivable: status.paymentsReceivable
    });
    
    return { success: true, status };
  } catch (error) {
    console.error('❌ Error refreshing PayPal account:', error);
    return { 
      success: false, 
      error: 'Failed to refresh PayPal account status' 
    };
  }
}

// Polling function to check PayPal accounts that might be in pending states
// This is especially useful for accounts waiting for webhooks that might never arrive
export async function pollPayPalAccountsForStatusUpdates() {
  try {
    console.log('🔍 Polling PayPal accounts for status updates...');
    
    // Find agencies with PayPal accounts that might need status updates
    // Target accounts that are:
    // 1. In pending status (waiting for onboarding completion)
    // 2. Haven't been synced recently (last sync > 30 minutes ago)
    // 3. Connected but missing key status flags
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: agencies, error: queryError } = await supabase
      .from('agencies')
      .select('id, slug, paypalAccountId, paypalAccountStatus, paypalLastSyncAt, paypalDetailsSubmitted, paypalPaymentsReceivable, paypalEmailConfirmed')
      .not('paypalAccountId', 'is', null) // Has a PayPal account
      .or(`
        paypalAccountStatus.eq.pending,
        paypalAccountStatus.eq.connected,
        paypalLastSyncAt.is.null,
        paypalLastSyncAt.lt.${thirtyMinutesAgo}
      `)
      .or(`
        paypalDetailsSubmitted.is.false,
        paypalPaymentsReceivable.is.false,
        paypalEmailConfirmed.is.false
      `)
      .limit(50); // Batch process to avoid overwhelming the API

    if (queryError) {
      console.error('❌ Error querying agencies for PayPal polling:', queryError);
      return { success: false, error: 'Failed to query agencies' };
    }

    if (!agencies || agencies.length === 0) {
      console.log('✅ No PayPal accounts need status polling');
      return { success: true, polledCount: 0 };
    }

    console.log(`🔍 Found ${agencies.length} PayPal accounts to poll for status updates`);

    const accessToken = await getPayPalAccessToken();
    const partnerId = process.env.PAYPAL_PARTNER_ID;
    
    let polledCount = 0;
    let updatedCount = 0;

    // Poll each agency's PayPal status
    for (const agency of agencies) {
      try {
        console.log(`🔍 Polling PayPal status for agency ${agency.slug} (${agency.paypalAccountId})`);
        polledCount++;

        if (!partnerId) {
          console.warn('⚠️ PAYPAL_PARTNER_ID not configured, skipping API status check');
          continue;
        }

        // Get seller integration status from PayPal API
        const statusResponse = await fetch(
          `${PAYPAL_BASE_URL}/v1/customer/partners/${partnerId}/merchant-integrations/${agency.paypalAccountId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (!statusResponse.ok) {
          console.warn(`⚠️ PayPal API returned ${statusResponse.status} for agency ${agency.slug}, skipping`);
          continue;
        }

        const sellerStatus = await statusResponse.json();
        console.log(`🏦 Retrieved PayPal status for agency ${agency.slug}:`, {
          paymentsReceivable: sellerStatus.payments_receivable,
          emailConfirmed: sellerStatus.primary_email_confirmed
        });

        // Determine if this is a meaningful update
        const isOnboardingComplete = sellerStatus.payments_receivable && sellerStatus.primary_email_confirmed;
        const hasStatusChanged = (
          agency.paypalPaymentsReceivable !== sellerStatus.payments_receivable ||
          agency.paypalEmailConfirmed !== sellerStatus.primary_email_confirmed ||
          (agency.paypalDetailsSubmitted !== isOnboardingComplete)
        );

        // Update database with latest status
        const updateData: any = {
          paypalEmailConfirmed: sellerStatus.primary_email_confirmed || false,
          paypalPaymentsReceivable: sellerStatus.payments_receivable || false,
          paypalDetailsSubmitted: isOnboardingComplete,
          paypalLastSyncAt: new Date().toISOString()
        };

        // Update account status based on capabilities
        if (isOnboardingComplete) {
          updateData.paypalAccountStatus = 'enabled';
        } else if (agency.paypalAccountStatus === 'pending' && (sellerStatus.payments_receivable || sellerStatus.primary_email_confirmed)) {
          updateData.paypalAccountStatus = 'connected'; // Partial setup
        }

        const { error: updateError } = await supabase
          .from('agencies')
          .update(updateData)
          .eq('id', agency.id);

        if (updateError) {
          console.error(`❌ Error updating agency ${agency.slug} PayPal status:`, updateError);
        } else {
          updatedCount++;
          if (hasStatusChanged) {
            console.log(`✅ Updated PayPal status for agency ${agency.slug}:`, {
              accountStatus: updateData.paypalAccountStatus || agency.paypalAccountStatus,
              paymentsReceivable: updateData.paypalPaymentsReceivable,
              emailConfirmed: updateData.paypalEmailConfirmed,
              onboardingComplete: isOnboardingComplete
            });
          }
        }

        // Rate limiting: wait between API calls to avoid hitting limits
        if (polledCount < agencies.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
      } catch (agencyError) {
        console.error(`❌ Error polling PayPal status for agency ${agency.slug}:`, agencyError);
      }
    }

    console.log(`✅ PayPal polling complete: ${polledCount} accounts polled, ${updatedCount} updated`);
    return { 
      success: true, 
      polledCount, 
      updatedCount,
      agencies: agencies.map(a => ({ id: a.id, slug: a.slug, accountId: a.paypalAccountId }))
    };
  } catch (error) {
    console.error('❌ Error in PayPal polling process:', error);
    return { 
      success: false, 
      error: 'Failed to poll PayPal account statuses' 
    };
  }
}

// Check if a specific agency's PayPal account needs status polling
export async function shouldPollPayPalStatus(agencyId: string): Promise<boolean> {
  try {
    const { data: agency } = await supabase
      .from('agencies')
      .select('paypalAccountId, paypalAccountStatus, paypalLastSyncAt, paypalDetailsSubmitted')
      .eq('id', agencyId)
      .single();

    if (!agency?.paypalAccountId) {
      return false; // No PayPal account to poll
    }

    // Poll if account is in pending status, hasn't been synced recently, or onboarding isn't complete
    const lastSyncThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const lastSyncAt = agency.paypalLastSyncAt ? new Date(agency.paypalLastSyncAt) : null;
    
    return (
      agency.paypalAccountStatus === 'pending' ||
      !agency.paypalDetailsSubmitted ||
      !lastSyncAt ||
      lastSyncAt < lastSyncThreshold
    );
  } catch (error) {
    console.error('Error checking if PayPal polling is needed:', error);
    return false;
  }
}