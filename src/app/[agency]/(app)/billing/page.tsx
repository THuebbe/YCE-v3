import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { SectionTabs } from '@/features/dashboard/components/section-tabs'
import { settingsSections } from '../settings/sections'
import { resolveTimeZone } from '@/features/booking/booking-rules'
import { BillingSection } from '../settings/components/BillingSection'
import { syncCustomerSubscription, syncFromCheckoutSession, trialDays } from '@/features/billing/stripe-billing'
import { hasLiveSubscription } from '@/features/billing/subscription'
import { isDemoMode } from '@/features/demo/config'
import { requireAgencyPage } from '@/features/dashboard/access'

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
  const { agency: agencySlug } = await params
  // The tenant check (and the demo's 4-hour gate), like every (app) page
  await requireAgencyPage(agencySlug)
  const { userId } = await auth()
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
    <div>
      <PageHeader
        title={welcome ? 'Last step: choose your plan' : 'Settings'}
        description={welcome
          ? 'Your agency is set up. Pick a plan to open your booking page to customers.'
          : undefined}
      />
      {/* Signup's last step stands alone; otherwise this is Settings > Plan & billing */}
      {!welcome && <SectionTabs label="Settings sections" active="plan" items={settingsSections(agencySlug)} />}
      {isDemoMode() ? (
        // Demo loaners have a stand-in Elite subscription and no Stripe customer
        <div className="rounded-card border border-line bg-surface p-5 shadow-raised">
          <h2 className="font-display text-heading font-semibold">Elite plan (demo)</h2>
          <p className="mt-2 text-copy text-fg-muted">
            This demo has every Elite feature turned on. In your own account, this is where you choose a plan,
            update your card and see invoices.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
