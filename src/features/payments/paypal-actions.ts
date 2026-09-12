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

    // For now, we don't check for existing PayPal accounts since the database
    // columns don't exist yet. Each request will create a new Partner Referral.

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
      ]
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

    // For now, we don't store PayPal integration data in the database
    // since the required columns don't exist yet. The integration will work
    // through the PayPal onboarding flow directly.
    console.log('✅ PayPal Partner Referral created successfully', {
      trackingId,
      referralId: referralData.partner_referral_id,
      actionUrl
    });

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
        paypal_account_id: sharedId,
        paypal_auth_code: authCode,
        paypal_shared_id: sharedId,
        paypal_account_status: 'connected',
        paypal_permissions_granted: true, // Permissions granted by completing OAuth flow
        paypal_last_sync_at: new Date().toISOString()
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
      hasPayPalAccount: !!agency.paypal_account_id 
    });

    // If no PayPal account exists
    if (!agency.paypal_account_id) {
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
          `${PAYPAL_BASE_URL}/v1/customer/partners/${partnerId}/merchant-integrations/${agency.paypal_account_id}`,
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
              paypal_email_confirmed: sellerStatus.primary_email_confirmed || false,
              paypal_payments_receivable: sellerStatus.payments_receivable || false,
              paypal_details_submitted: (sellerStatus.payments_receivable && sellerStatus.primary_email_confirmed) || false,
              paypal_last_sync_at: new Date().toISOString()
            })
            .eq('id', agency.id);
        }
      }
    } catch (apiError) {
      console.warn('⚠️ Could not fetch PayPal seller status from API, using cached data:', apiError);
    }

    // Return status (using API data if available, otherwise cached database data)
    return {
      accountId: agency.paypal_account_id,
      isConnected: !!agency.paypal_account_id,
      hasCompletedOnboarding: agency.paypal_details_submitted || (sellerStatus?.payments_receivable && sellerStatus?.primary_email_confirmed),
      permissionsGranted: agency.paypal_permissions_granted || false,
      emailConfirmed: agency.paypal_email_confirmed || sellerStatus?.primary_email_confirmed || false,
      paymentsReceivable: agency.paypal_payments_receivable || sellerStatus?.payments_receivable || false,
      detailsSubmitted: agency.paypal_details_submitted || false,
      authCode: agency.paypal_auth_code,
      sharedId: agency.paypal_shared_id,
      lastSyncAt: agency.paypal_last_sync_at,
      integrationData: agency.paypal_integration_data,
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
          accountId: user.agency.paypal_account_id,
          isConnected: !!user.agency.paypal_account_id,
          hasCompletedOnboarding: user.agency.paypal_details_submitted || false,
          permissionsGranted: user.agency.paypal_permissions_granted || false,
          emailConfirmed: user.agency.paypal_email_confirmed || false,
          paymentsReceivable: user.agency.paypal_payments_receivable || false,
          detailsSubmitted: user.agency.paypal_details_submitted || false,
          authCode: user.agency.paypal_auth_code,
          sharedId: user.agency.paypal_shared_id,
          lastSyncAt: user.agency.paypal_last_sync_at,
          integrationData: user.agency.paypal_integration_data,
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
      .select('id, slug, paypal_account_id, paypal_account_status, paypal_last_sync_at, paypal_details_submitted, paypal_payments_receivable, paypal_email_confirmed')
      .not('paypal_account_id', 'is', null) // Has a PayPal account
      .or(`
        paypal_account_status.eq.pending,
        paypal_account_status.eq.connected,
        paypal_last_sync_at.is.null,
        paypal_last_sync_at.lt.${thirtyMinutesAgo}
      `)
      .or(`
        paypal_details_submitted.is.false,
        paypal_payments_receivable.is.false,
        paypal_email_confirmed.is.false
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
        console.log(`🔍 Polling PayPal status for agency ${agency.slug} (${agency.paypal_account_id})`);
        polledCount++;

        if (!partnerId) {
          console.warn('⚠️ PAYPAL_PARTNER_ID not configured, skipping API status check');
          continue;
        }

        // Get seller integration status from PayPal API
        const statusResponse = await fetch(
          `${PAYPAL_BASE_URL}/v1/customer/partners/${partnerId}/merchant-integrations/${agency.paypal_account_id}`,
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
          agency.paypal_payments_receivable !== sellerStatus.payments_receivable ||
          agency.paypal_email_confirmed !== sellerStatus.primary_email_confirmed ||
          (agency.paypal_details_submitted !== isOnboardingComplete)
        );

        // Update database with latest status
        const updateData: any = {
          paypal_email_confirmed: sellerStatus.primary_email_confirmed || false,
          paypal_payments_receivable: sellerStatus.payments_receivable || false,
          paypal_details_submitted: isOnboardingComplete,
          paypal_last_sync_at: new Date().toISOString()
        };

        // Update account status based on capabilities
        if (isOnboardingComplete) {
          updateData.paypal_account_status = 'enabled';
        } else if (agency.paypal_account_status === 'pending' && (sellerStatus.payments_receivable || sellerStatus.primary_email_confirmed)) {
          updateData.paypal_account_status = 'connected'; // Partial setup
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
              accountStatus: updateData.paypal_account_status || agency.paypal_account_status,
              paymentsReceivable: updateData.paypal_payments_receivable,
              emailConfirmed: updateData.paypal_email_confirmed,
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
      agencies: agencies.map(a => ({ id: a.id, slug: a.slug, accountId: a.paypal_account_id }))
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
      .select('paypal_account_id, paypal_account_status, paypal_last_sync_at, paypal_details_submitted')
      .eq('id', agencyId)
      .single();

    if (!agency?.paypal_account_id) {
      return false; // No PayPal account to poll
    }

    // Poll if account is in pending status, hasn't been synced recently, or onboarding isn't complete
    const lastSyncThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const lastSyncAt = agency.paypal_last_sync_at ? new Date(agency.paypal_last_sync_at) : null;
    
    return (
      agency.paypal_account_status === 'pending' ||
      !agency.paypal_details_submitted ||
      !lastSyncAt ||
      lastSyncAt < lastSyncThreshold
    );
  } catch (error) {
    console.error('Error checking if PayPal polling is needed:', error);
    return false;
  }
}