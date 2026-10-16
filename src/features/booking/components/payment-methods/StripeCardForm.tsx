'use client';

import React, { useEffect } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

/**
 * Stripe.js for one agency. Booking payments are direct charges on the
 * agency's connected account, so Stripe.js runs "as" that account.
 */
const stripeByAccount = new Map<string, Promise<StripeJs | null>>();
export function stripeForAccount(accountId: string): Promise<StripeJs | null> | null {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) return null;
  if (!stripeByAccount.has(accountId)) {
    stripeByAccount.set(accountId, loadStripe(publishableKey, { stripeAccount: accountId }));
  }
  return stripeByAccount.get(accountId)!;
}

export type CollectedCard =
  | { ok: true; confirmationTokenId: string; brand?: string; last4?: string }
  | { ok: false; error: string };

interface StripeCardFormProps {
  accountId: string;
  amountCents: number;
  billing: { name?: string; email?: string; phone?: string };
  /** Receives the function the Continue button calls to collect the card */
  onReady: (collect: () => Promise<CollectedCard>) => void;
}

/**
 * Card entry on the Payment step. Nothing is charged here: "collect" turns
 * the card into a one-time ConfirmationToken, and Place Order (Review step)
 * charges it on the server after the customer has seen the summary.
 */
export function StripeCardForm({ accountId, amountCents, billing, onReady }: StripeCardFormProps) {
  const stripePromise = stripeForAccount(accountId);
  if (!stripePromise) {
    return (
      <p className="text-body-small text-error-red">
        Card payments aren&apos;t configured on this site yet. Please contact the agency.
      </p>
    );
  }
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: amountCents,
        currency: 'usd',
        // Saved to the agency's customer for later fees (late return, damage)
        setupFutureUsage: 'off_session',
        paymentMethodTypes: ['card'],
        appearance: { theme: 'stripe', variables: { colorPrimary: '#7c3aed', borderRadius: '8px' } },
      }}
    >
      <CardFields billing={billing} onReady={onReady} />
    </Elements>
  );
}

function CardFields({ billing, onReady }: Pick<StripeCardFormProps, 'billing' | 'onReady'>) {
  const stripe = useStripe();
  const elements = useElements();
  const billingKey = JSON.stringify(billing);

  useEffect(() => {
    onReady(async () => {
      if (!stripe || !elements) return { ok: false, error: 'The card form is still loading. Please try again.' };
      const { error: submitError } = await elements.submit();
      if (submitError) return { ok: false, error: submitError.message ?? 'Please check your card details.' };
      const { error, confirmationToken } = await stripe.createConfirmationToken({
        elements,
        params: { payment_method_data: { billing_details: JSON.parse(billingKey) } },
      });
      if (error || !confirmationToken) return { ok: false, error: error?.message ?? 'Your card could not be saved.' };
      const card = confirmationToken.payment_method_preview?.card;
      return { ok: true, confirmationTokenId: confirmationToken.id, brand: card?.brand, last4: card?.last4 ?? undefined };
    });
  }, [stripe, elements, billingKey, onReady]);

  return <PaymentElement options={{ layout: 'tabs' }} />;
}
