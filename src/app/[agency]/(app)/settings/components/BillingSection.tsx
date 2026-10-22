'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Check, CreditCard } from 'lucide-react'
import { openBillingPortal, startSubscription } from '@/features/billing/actions'
import {
  PLAN_PRICES,
  graceEndsAt,
  hasLiveSubscription,
  priceKeyInfo,
  subscriptionAllowsBookings,
  type AgencySubscription,
  type BillingInterval,
} from '@/features/billing/subscription'
import { PLAN_LABELS, type Plan } from '@/features/billing/entitlements'

const PLAN_FEATURES: Record<Plan, string[]> = {
  essentials: [
    'Online booking page',
    'Email on every new order',
    'Inventory and order board',
    'Order summary PDF',
  ],
  elite: [
    'Everything in Essentials',
    'Pick tickets and pickup checklists',
    'Your own cancellation, late and damage fees',
    'Revenue on your dashboard',
  ],
}

/** In the agency's time zone: a trial ending 01:39 UTC Nov 2 ends Nov 1 in Denver (Stripe's portal agrees) */
function formatDate(iso: string | null | undefined, timeZone?: string) {
  if (!iso) return ''
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: timeZone || 'UTC' }
  try {
    return new Date(iso).toLocaleDateString('en-US', opts)
  } catch {
    return new Date(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
  }
}

interface BillingSectionProps {
  subscription: AgencySubscription
  trialDays: number
  /** Came back from Stripe Checkout */
  returnState?: 'success' | 'cancelled'
  /** Shown after subscribing (the billing page) */
  dashboardHref?: string
  /** The agency's IANA zone, for dates */
  timeZone?: string
}

export function BillingSection({ subscription, trialDays, returnState, dashboardHref, timeZone }: BillingSectionProps) {
  const [period, setPeriod] = useState<BillingInterval>('month')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const live = hasLiveSubscription(subscription)
  const open = subscriptionAllowsBookings(subscription)
  const current = priceKeyInfo(subscription.subscription_price)
  // One trial per agency: only before the first subscription
  const offerTrial = trialDays > 0 && !subscription.stripe_subscription_id

  const go = async (key: string, run: () => ReturnType<typeof openBillingPortal>) => {
    setBusy(key)
    setError(null)
    const result = await run()
    if (result.success) {
      window.location.href = result.url
      return
    }
    setError(result.error)
    setBusy(null)
  }

  return (
    <Card id="billing" className="shadow-raised border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription
        </CardTitle>
        <CardDescription>Your YardCard Elite plan. Billed by YardCard Elite through Stripe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {returnState === 'success' && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Thanks! Your subscription is set up and your booking page is open.
              {dashboardHref && <> <a href={dashboardHref} className="font-medium underline">Go to your dashboard</a></>}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {live ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-card p-4 shadow-raised">
              <div>
                <p className="text-base font-medium">
                  {current ? `${PLAN_LABELS[current.plan]} · ${current.interval === 'year' ? 'annual' : 'monthly'}` : 'Subscription'}
                </p>
                <p className="text-fine text-muted-foreground">{statusLine(subscription, timeZone)}</p>
              </div>
              <Button onClick={() => go('portal', openBillingPortal)} disabled={!!busy}>
                {busy === 'portal' ? 'Opening…' : 'Manage billing'}
              </Button>
            </div>
            {!open && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your booking page is closed to new bookings until your payment goes through. Update your card in Manage billing.
                </AlertDescription>
              </Alert>
            )}
            {open && subscription.subscription_status === 'past_due' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your last payment failed. Update your card by {formatDate(graceEndsAt(subscription)?.toISOString(), timeZone)} or your booking page closes to new bookings.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-fine text-muted-foreground">
              Change plan, update your card, see invoices or cancel in Manage billing.
            </p>
          </>
        ) : (
          <>
            <Alert variant={subscription.stripe_subscription_id ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {subscription.stripe_subscription_id
                  ? 'Your subscription has ended, so your booking page is closed to new bookings. Choose a plan to reopen it.'
                  : 'Choose a plan to open your booking page to customers.'}
              </AlertDescription>
            </Alert>

            <div className="inline-flex rounded-card bg-muted p-1 text-fine" role="group" aria-label="Billing period">
              {(['month', 'year'] as BillingInterval[]).map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPeriod(i)}
                  aria-pressed={period === i}
                  className={`rounded-control px-3 py-1.5 ${period === i ? 'bg-surface shadow-raised font-medium' : 'text-muted-foreground'}`}
                >
                  {i === 'month' ? 'Monthly' : 'Annual (save ~15%)'}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(['essentials', 'elite'] as Plan[]).map(plan => (
                <div key={plan} className="flex flex-col rounded-card p-4 shadow-raised">
                  <p className="text-base font-medium">{PLAN_LABELS[plan]}</p>
                  <p className="mt-1 text-2xl font-bold">
                    ${PLAN_PRICES[plan][period]}
                    <span className="text-fine font-normal text-muted-foreground">/{period === 'month' ? 'month' : 'year'}</span>
                  </p>
                  <ul className="mt-3 flex-1 space-y-1 text-fine text-muted-foreground">
                    {PLAN_FEATURES[plan].map(f => (
                      <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />{f}</li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4"
                    variant={plan === 'elite' ? 'primary' : 'secondary'}
                    disabled={!!busy}
                    onClick={() => go(plan, () => startSubscription(plan, period))}
                  >
                    {busy === plan ? 'Opening checkout…' : offerTrial ? `Start ${trialDays}-day free trial` : `Choose ${PLAN_LABELS[plan]}`}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-fine text-muted-foreground">
              {offerTrial
                ? `A card is needed to start. You won't be charged until the trial ends, and you can cancel any time before then.`
                : 'You can cancel any time; your plan runs to the end of the period you paid for.'}
              {' '}Have a promo code? Enter it at checkout. Subscribing means you agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener" className="underline">Terms of Service</a>.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function statusLine(sub: AgencySubscription, timeZone?: string): string {
  const end = formatDate(sub.subscription_current_period_end, timeZone)
  switch (sub.subscription_status) {
    case 'trialing':
      return sub.subscription_cancel_at_period_end
        ? `Free trial ends ${formatDate(sub.subscription_trial_end, timeZone)}, then your subscription stops.`
        : `Free trial until ${formatDate(sub.subscription_trial_end, timeZone)}. Your first payment is on that day.`
    case 'active':
      return sub.subscription_cancel_at_period_end ? `Cancelled - active until ${end}.` : `Renews ${end}.`
    case 'past_due':
      return 'Payment failed - Stripe is retrying your card.'
    case 'unpaid':
      return 'Unpaid - update your card to reopen bookings.'
    case 'incomplete':
      return 'Waiting for your first payment to go through.'
    case 'paused':
      return 'Paused.'
    default:
      return ''
  }
}
