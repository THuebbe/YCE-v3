import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/db/supabase-client';
import crypto from 'crypto';

// PayPal webhook configuration
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_WEBHOOK_SECRET = process.env.PAYPAL_WEBHOOK_SECRET;

// PayPal webhook signature verification
async function verifyPayPalWebhook(body: string, signature: string, webhookId: string): Promise<boolean> {
  try {
    // Get PayPal access token for verification API
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get PayPal access token for webhook verification');
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify webhook using PayPal's verification API
    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: 'SHA256withRSA',
        cert_id: signature,
        transmission_id: signature, // PayPal transmission ID from headers
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      })
    });

    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification failed:', verifyResponse.status);
      return false;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    
    // Fallback: use webhook secret for basic verification if available
    if (PAYPAL_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', PAYPAL_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    }
    
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is properly configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal not configured: missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
      return new NextResponse('PayPal not configured', { status: 500 });
    }

    const body = await request.text();
    const headersList = await headers();
    
    // PayPal webhook headers
    const signature = headersList.get('paypal-transmission-sig');
    const transmissionId = headersList.get('paypal-transmission-id');
    const certId = headersList.get('paypal-cert-id');
    const authAlgo = headersList.get('paypal-auth-algo');
    
    if (!signature || !transmissionId || !certId) {
      console.error('Missing PayPal webhook headers');
      return new NextResponse('Missing webhook headers', { status: 400 });
    }

    // Parse webhook event
    let event: any;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Invalid PayPal webhook JSON:', error);
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    // Verify webhook signature (in production, always verify)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyPayPalWebhook(body, signature, process.env.PAYPAL_WEBHOOK_ID || '');
      if (!isValid) {
        console.error('PayPal webhook signature verification failed');
        return new NextResponse('Invalid signature', { status: 400 });
      }
    }

    console.log('🏦 Processing PayPal webhook event:', event.event_type, 'ID:', event.id);

    // Handle the event
    switch (event.event_type) {
      case 'MERCHANT.ONBOARDING.COMPLETED': {
        console.log('🎯 Merchant onboarding completed event received');
        
        try {
          // Extract merchant information from webhook
          const resource = event.resource;
          const merchantId = resource?.merchant_id;
          const partnerId = resource?.partner_id;
          
          if (!merchantId) {
            console.error('No merchant ID in MERCHANT.ONBOARDING.COMPLETED event');
            break;
          }

          console.log('🏦 Processing onboarding completion for merchant:', merchantId);

          // Find agency by PayPal account ID or shared ID
          const { data: agencies, error: findError } = await supabase
            .from('agencies')
            .select('*')
            .or(`paypalAccountId.eq.${merchantId},paypalSharedId.eq.${merchantId}`)
            .limit(1);

          if (findError) {
            console.error('Error finding agency for PayPal merchant:', findError);
            break;
          }

          if (!agencies || agencies.length === 0) {
            console.warn('No agency found for PayPal merchant ID:', merchantId);
            break;
          }

          const agency = agencies[0];
          console.log('🏦 Found agency for PayPal onboarding:', agency.id, agency.slug);

          // Update agency with completed onboarding status
          const updateData: any = {
            paypalAccountStatus: 'enabled',
            paypalPermissionsGranted: true,
            paypalEmailConfirmed: true, // Assume confirmed if onboarding completed
            paypalPaymentsReceivable: true, // Assume payments enabled if onboarding completed
            paypalDetailsSubmitted: true,
            paypalLastSyncAt: new Date().toISOString(),
            paypalIntegrationData: JSON.stringify({
              ...JSON.parse(agency.paypalIntegrationData || '{}'),
              onboardingCompletedAt: new Date().toISOString(),
              webhookEvent: event.id
            })
          };

          // If we don't have an account ID yet, use the merchant ID from webhook
          if (!agency.paypalAccountId) {
            updateData.paypalAccountId = merchantId;
          }

          const { error: updateError } = await supabase
            .from('agencies')
            .update(updateData)
            .eq('id', agency.id);

          if (updateError) {
            console.error('Error updating agency PayPal status after onboarding completion:', updateError);
            throw updateError;
          }

          console.log('✅ Updated agency', agency.id, 'PayPal onboarding completed:', {
            merchantId,
            paypalAccountStatus: 'enabled',
            eventId: event.id
          });
        } catch (error) {
          console.error('Failed to process MERCHANT.ONBOARDING.COMPLETED:', error);
        }
        break;
      }

      case 'MERCHANT.PARTNER-CONSENT.REVOKED': {
        console.log('🚫 Merchant partner consent revoked event received');
        
        try {
          // Extract merchant information from webhook
          const resource = event.resource;
          const merchantId = resource?.merchant_id;
          
          if (!merchantId) {
            console.error('No merchant ID in MERCHANT.PARTNER-CONSENT.REVOKED event');
            break;
          }

          console.log('🏦 Processing consent revocation for merchant:', merchantId);

          // Find agency by PayPal account ID
          const { data: agencies, error: findError } = await supabase
            .from('agencies')
            .select('*')
            .eq('paypalAccountId', merchantId)
            .limit(1);

          if (findError) {
            console.error('Error finding agency for PayPal merchant:', findError);
            break;
          }

          if (!agencies || agencies.length === 0) {
            console.warn('No agency found for PayPal merchant ID:', merchantId);
            break;
          }

          const agency = agencies[0];
          console.log('🏦 Found agency for PayPal consent revocation:', agency.id, agency.slug);

          // Update agency to reflect revoked permissions
          const { error: updateError } = await supabase
            .from('agencies')
            .update({
              paypalAccountStatus: 'disconnected',
              paypalPermissionsGranted: false,
              paypalEmailConfirmed: false,
              paypalPaymentsReceivable: false,
              paypalDetailsSubmitted: false,
              paypalOnboardingUrl: null, // Clear onboarding URL
              paypalLastSyncAt: new Date().toISOString(),
              paypalIntegrationData: JSON.stringify({
                ...JSON.parse(agency.paypalIntegrationData || '{}'),
                consentRevokedAt: new Date().toISOString(),
                webhookEvent: event.id
              })
            })
            .eq('id', agency.id);

          if (updateError) {
            console.error('Error updating agency PayPal status after consent revocation:', updateError);
            throw updateError;
          }

          console.log('✅ Updated agency', agency.id, 'PayPal consent revoked:', {
            merchantId,
            paypalAccountStatus: 'disconnected',
            eventId: event.id
          });
        } catch (error) {
          console.error('Failed to process MERCHANT.PARTNER-CONSENT.REVOKED:', error);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Handle successful PayPal payment capture
        const resource = event.resource;
        console.log(`PayPal payment captured: ${resource?.id}`);
        // Add your payment success logic here
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        // Handle failed/denied PayPal payment
        const resource = event.resource;
        console.log(`PayPal payment denied: ${resource?.id}`);
        // Add your payment failure logic here
        break;
      }

      default:
        console.log(`Unhandled PayPal webhook event type: ${event.event_type}`);
    }

    return new NextResponse('PayPal webhook processed', { status: 200 });
  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
}

// Handle GET requests (for webhook endpoint verification)
export async function GET() {
  const isConfigured = !!(
    process.env.PAYPAL_CLIENT_ID && 
    process.env.PAYPAL_CLIENT_SECRET
  );
  
  return new NextResponse(JSON.stringify({
    status: 'PayPal webhook endpoint active',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}