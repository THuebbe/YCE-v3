import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/db/supabase-client';
import { handleChargeRefunded, handleCheckoutPaymentFailed, handleCheckoutPaymentSucceeded } from '@/features/booking/checkout';
import { subscriptionIdOf, syncSubscription } from '@/features/billing/stripe-billing';
import { handleFeeCheckoutCompleted } from '@/features/orders/fees';

// Initialize Stripe client only if environment variables are available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
}) : null;

// Two Stripe endpoints deliver here: the Connect one (agency accounts and
// booking payments) and the platform one (agency subscriptions). Each has
// its own signing secret.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const billingWebhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET;

function verifyEvent(stripe: Stripe, body: string, signature: string): Stripe.Event {
  const secrets = [webhookSecret, billingWebhookSecret].filter((s): s is string => !!s);
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('No webhook secret configured');
}

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
      event = verifyEvent(stripe, body, signature);
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

      // Refunds, including ones made in the agency's Stripe Dashboard
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // Agency subscriptions (platform account: no event.account). Every one
      // re-reads the subscription from Stripe. Errors return 500 so Stripe
      // retries: a missed sync could leave a booking page open or closed.
      // A customer paid a late/damage fee link (Checkout on the agency's account)
      case 'checkout.session.completed':
        if (event.account) {
          await handleFeeCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        }
      // falls through: on the platform account it's an agency subscription
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        if (event.account) break; // not ours: a connected account's own billing
        const subscriptionId = subscriptionIdOf(event.data.object as Stripe.Invoice | Stripe.Subscription | Stripe.Checkout.Session);
        if (subscriptionId) await syncSubscription(subscriptionId, `${event.type} ${event.id}`);
        break;
      }

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