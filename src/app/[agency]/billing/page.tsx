import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { Header } from '@/shared/components/layout/Header'
import { resolveTimeZone } from '@/features/booking/booking-rules'
import { BillingSection } from '../settings/components/BillingSection'
import { syncCustomerSubscription, syncFromCheckoutSession, trialDays } from '@/features/billing/stripe-billing'
import { hasLiveSubscription } from '@/features/billing/subscription'

export const dynamic = 'force-dynamic'

interface BillingPageProps {
  params: Promise<{ agency: string }>
  searchParams: Promise<{ billing?: string; session_id?: string; welcome?: string }>
}

const ADMIN_ROLES = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN']

/**
 * The agency's subscription: choose a plan (last step of signup), or see
 * and manage the current one. Stripe Checkout and the billing portal come
 * back here.
 */
export default async function BillingPage({ params, searchParams }: BillingPageProps) {
  const { userId } = await auth()
  const { agency: agencySlug } = await params
  const { billing, session_id, welcome } = await searchParams
  if (!userId) redirect('/auth/sign-in')

  const [found, user] = await Promise.all([getAgencyBySlug(agencySlug), getUserById(userId)])
  if (!found || !user || user.agency?.slug !== agencySlug) redirect('/routing')
  if (!ADMIN_ROLES.includes(user.role)) redirect(`/${agencySlug}/dashboard`)

  let agency = found
  // Sync now rather than wait for the webhook, so this page (and the booking
  // page) show the new subscription: back from Checkout, or a customer with
  // no subscription on record yet (the return's ?session_id can get lost)
  const fromCheckout = billing === 'success' && !!session_id
  if (fromCheckout || (agency.stripe_customer_id && !hasLiveSubscription(agency))) {
    try {
      if (fromCheckout) await syncFromCheckoutSession(session_id!, agency.id)
      else await syncCustomerSubscription(agency.id, 'billing page')
      agency = (await getAgencyBySlug(agencySlug)) ?? agency
    } catch (error) {
      console.error('Billing sync on the billing page failed (the webhook will retry):', error)
    }
  }
  // Just subscribed (whichever way the sync happened)
  const justSubscribed = fromCheckout || (!hasLiveSubscription(found) && hasLiveSubscription(agency))

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {welcome ? 'Last step: choose your plan' : 'Billing'}
          </h1>
          <p className="text-neutral-600">
            {welcome
              ? 'Your agency is set up. Pick a plan to open your booking page to customers.'
              : 'Your YardCard Elite subscription.'}
          </p>
        </div>
        <BillingSection
          subscription={{
            stripe_subscription_id: agency.stripe_subscription_id,
            subscription_status: agency.subscription_status,
            subscription_price: agency.subscription_price,
            subscription_current_period_end: agency.subscription_current_period_end,
            subscription_trial_end: agency.subscription_trial_end,
            subscription_cancel_at_period_end: agency.subscription_cancel_at_period_end,
            subscription_past_due_since: agency.subscription_past_due_since,
          }}
          trialDays={trialDays()}
          timeZone={resolveTimeZone(agency.operating_hours)}
          returnState={justSubscribed ? 'success' : billing === 'cancelled' ? 'cancelled' : undefined}
          dashboardHref={`/${agencySlug}/dashboard`}
        />
      </main>
    </div>
  )
}
