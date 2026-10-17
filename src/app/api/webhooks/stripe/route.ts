import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/db/supabase-client';
import { handleCheckoutPaymentFailed, handleCheckoutPaymentSucceeded } from '@/features/booking/checkout';

// Initialize Stripe client only if environment variables are available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/** Mirrors the connected account's current state onto its agency. */
async function syncAgencyStripeAccount(stripe: Stripe, accountId: string, eventId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    const { error } = await supabase
      .from('agencies')
      .update({
        stripe_account_status: account.charges_enabled ? 'enabled' : 'pending',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
      })
      .eq('stripe_account_id', account.id);
    if (error) throw error;
    console.log('✅ Synced Stripe account', account.id, { chargesEnabled: account.charges_enabled, eventId });
  } catch (error) {
    console.error('Failed to sync agency Stripe account:', accountId, eventId, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!stripe || !webhookSecret) {
      console.error('Stripe not configured: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
      return new NextResponse('Stripe not configured', { status: 500 });
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new NextResponse('No signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    console.log('🎯 Processing Stripe webhook event:', event.type, 'ID:', event.id);

    // Handle the event
    switch (event.type) {
      // Account status: always re-read the account from Stripe. Events can
      // arrive late or out of order (Stripe retries failed deliveries for
      // days), so the copy inside an old event must never overwrite the
      // current state.
      case 'account.updated':
      case 'capability.updated':
      case 'person.created':
      case 'person.updated': {
        const object = event.data.object as { id?: string; account?: string | Stripe.Account };
        const accountId = event.account
          ?? (event.type === 'account.updated' ? object.id : typeof object.account === 'string' ? object.account : object.account?.id);
        if (accountId) await syncAgencyStripeAccount(stripe, accountId, event.id);
        break;
      }

      case 'account.application.deauthorized': {
        const application = event.data.object as Stripe.Application;
        
        try {
          // Handle account disconnection
          const { error } = await supabase
            .from('agencies')
            .update({
              stripe_account_id: null,
              stripe_account_status: null,
              stripe_onboarding_url: null,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
              stripe_details_submitted: false,
            })
            .eq('stripe_account_id', application.id);

          if (error) {
            console.error('Error deauthorizing agency Stripe account:', error);
            throw error;
          }

          console.log(`Deauthorized account ${application.id}`);
        } catch (error) {
          console.error('Failed to deauthorize agency Stripe account:', error);
        }
        break;
      }

      // Booking payments are direct charges on agency accounts (Connect
      // events, event.account set). If the customer's browser went away
      // after paying, this creates the order; otherwise it's a no-op.
      case 'payment_intent.succeeded':
        await handleCheckoutPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await handleCheckoutPaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
}

// Handle GET requests (for webhook endpoint verification)
export async function GET() {
  const isConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  
  return new NextResponse(JSON.stringify({
    status: 'Stripe webhook endpoint active',
    configured: isConfigured,
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}