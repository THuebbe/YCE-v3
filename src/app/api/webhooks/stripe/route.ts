import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';

// Initialize Stripe client only if environment variables are available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
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

    console.log('Processing Stripe webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        // Update the agency's Stripe account status
        await prisma.agency.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeDetailsSubmitted: account.details_submitted,
          },
        });

        console.log(`Updated account ${account.id} status`);
        break;
      }

      case 'account.application.deauthorized': {
        const application = event.data.object as Stripe.Application;
        
        // Handle account disconnection
        await prisma.agency.updateMany({
          where: { stripeAccountId: application.id },
          data: {
            stripeAccountId: null,
            stripeAccountStatus: null,
            stripeOnboardingUrl: null,
            stripeChargesEnabled: false,
            stripePayoutsEnabled: false,
            stripeDetailsSubmitted: false,
          },
        });

        console.log(`Deauthorized account ${application.id}`);
        break;
      }

      case 'capability.updated': {
        const capability = event.data.object as Stripe.Capability;
        
        // Update capabilities when they change
        const account = await stripe!.accounts.retrieve(capability.account as string);
        
        await prisma.agency.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeDetailsSubmitted: account.details_submitted,
          },
        });

        console.log(`Updated capabilities for account ${account.id}`);
        break;
      }

      case 'person.created':
      case 'person.updated': {
        const person = event.data.object as Stripe.Person;
        
        // Update account status when person information changes
        const account = await stripe!.accounts.retrieve(person.account as string);
        
        await prisma.agency.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeAccountStatus: account.charges_enabled ? 'enabled' : 'pending',
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeDetailsSubmitted: account.details_submitted,
          },
        });

        console.log(`Updated account ${account.id} after person ${event.type}`);
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
  return new NextResponse('Stripe webhook endpoint', { status: 200 });
}