import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { Header } from '@/shared/components/layout/Header'
import { BillingSection } from '../settings/components/BillingSection'
import { syncFromCheckoutSession, trialDays } from '@/features/billing/stripe-billing'

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
  // Back from Stripe Checkout: sync now rather than wait for the webhook,
  // so this page (and the booking page) reflect the new subscription
  if (billing === 'success' && session_id) {
    try {
      await syncFromCheckoutSession(session_id, agency.id)
      agency = (await getAgencyBySlug(agencySlug)) ?? agency
    } catch (error) {
      console.error('Billing return sync failed (the webhook will retry):', error)
    }
  }

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
          returnState={billing === 'success' ? 'success' : billing === 'cancelled' ? 'cancelled' : undefined}
          dashboardHref={`/${agencySlug}/dashboard`}
        />
      </main>
    </div>
  )
}
