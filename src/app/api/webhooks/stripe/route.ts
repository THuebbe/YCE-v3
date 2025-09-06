import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/db/supabase-client';

// Initialize Stripe client only if environment variables are available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        try {
          // Update the agency's Stripe account status
          const { error } = await supabase
            .from('agencies')
            .update({
              stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
              stripeChargesEnabled: account.charges_enabled,
              stripePayoutsEnabled: account.payouts_enabled,
              stripeDetailsSubmitted: account.details_submitted,
            })
            .eq('stripeAccountId', account.id);

          if (error) {
            console.error('Error updating agency Stripe status:', error);
            throw error;
          }

          console.log('✅ Updated account', account.id, 'status:', {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            eventId: event.id
          });
        } catch (error) {
          console.error('Failed to update agency Stripe status:', error);
        }
        break;
      }

      case 'account.application.deauthorized': {
        const application = event.data.object as Stripe.Application;
        
        try {
          // Handle account disconnection
          const { error } = await supabase
            .from('agencies')
            .update({
              stripeAccountId: null,
              stripeAccountStatus: null,
              stripeOnboardingUrl: null,
              stripeChargesEnabled: false,
              stripePayoutsEnabled: false,
              stripeDetailsSubmitted: false,
            })
            .eq('stripeAccountId', application.id);

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

      case 'capability.updated': {
        const capability = event.data.object as Stripe.Capability;
        
        try {
          // Update capabilities when they change
          const account = await stripe!.accounts.retrieve(capability.account as string);
          
          const { error } = await supabase
            .from('agencies')
            .update({
              stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
              stripeChargesEnabled: account.charges_enabled,
              stripePayoutsEnabled: account.payouts_enabled,
              stripeDetailsSubmitted: account.details_submitted,
            })
            .eq('stripeAccountId', account.id);

          if (error) {
            console.error('Error updating agency capabilities:', error);
            throw error;
          }

          console.log(`Updated capabilities for account ${account.id}`);
        } catch (error) {
          console.error('Failed to update agency capabilities:', error);
        }
        break;
      }

      case 'person.created':
      case 'person.updated': {
        const person = event.data.object as Stripe.Person;
        
        try {
          // Update account status when person information changes
          const account = await stripe!.accounts.retrieve(person.account as string);
          
          const { error } = await supabase
            .from('agencies')
            .update({
              stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
              stripeChargesEnabled: account.charges_enabled,
              stripePayoutsEnabled: account.payouts_enabled,
              stripeDetailsSubmitted: account.details_submitted,
            })
            .eq('stripeAccountId', account.id);

          if (error) {
            console.error('Error updating agency after person change:', error);
            throw error;
          }

          console.log(`Updated account ${account.id} after person ${event.type}`);
        } catch (error) {
          console.error('Failed to update agency after person change:', error);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Handle successful payment
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        // Add your payment success logic here
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Handle failed payment
        console.log(`Payment failed: ${paymentIntent.id}`);
        // Add your payment failure logic here
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