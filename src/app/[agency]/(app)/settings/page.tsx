import { redirect } from 'next/navigation'
import { requireAgencyPage } from '@/features/dashboard/access'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { AgencyProfileSection } from './components/AgencyProfileSection'
import FinancialManagementSection from './components/FinancialManagementSection'
import AgencySettingsSection from './components/AgencySettingsSection'
import { resolveTimeZone } from '@/features/booking/booking-rules'
import { BillingSection } from './components/BillingSection'
import { trialDays } from '@/features/billing/stripe-billing'
import { PoliciesCard } from './components/PoliciesCard'
import { parsePolicies } from '@/features/booking/policies'
import { hasFeature, planOf } from '@/features/billing/entitlements'

interface SettingsPageProps {
  params: Promise<{
    agency: string
  }>
  searchParams: Promise<{
    success?: string
    refresh?: string
    braintree_success?: string
    braintree_refresh?: string
  }>
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { agency: agencySlug } = await params
  const { success, refresh, braintree_success, braintree_refresh } = await searchParams
  const { agency, user } = await requireAgencyPage(agencySlug)

  // Settings are for the agency's admins
  if (!['ADMIN', 'SUPER_USER', 'SUPER_ADMIN'].includes(user.role)) {
    redirect(`/${agencySlug}/dashboard`)
  }

    return (
      <>
          <PageHeader title="Settings" description="Your business, booking page, payments and plan." />

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Subscription */}
            <section>
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
              />
            </section>

            {/* Agency Profile Section */}
            <section>
              <AgencyProfileSection 
                agency={agency}
                agencySlug={agencySlug}
              />
            </section>

            {/* Financial Management Section */}
            <section>
              <FinancialManagementSection 
                agency={agency} 
                stripeReturnSuccess={success === 'true'}
                stripeReturnRefresh={refresh === 'true'}
                braintreeReturnSuccess={braintree_success === 'true'}
                braintreeReturnRefresh={braintree_refresh === 'true'}
              />
            </section>

            {/* Cancellation / late / damage fees (Elite) */}
            <section>
              <PoliciesCard
                policies={parsePolicies(agency.policy_config, agency.pricing_config)}
                canEdit={hasFeature(planOf(agency), 'policySettings')}
                billingHref={`/${agencySlug}/billing`}
              />
            </section>

            {/* Agency Settings Section */}
            <section>
              <AgencySettingsSection agency={agency} canEditBookingRules={hasFeature(planOf(agency), 'policySettings')} />
            </section>

            {/* Team Management Section - Future Feature */}
            <section>
              <div className="bg-white rounded-lg shadow-default p-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Team Management
                  </h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-4">
                    Invite team members, manage roles, and control access permissions.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    Future Feature
                  </div>
                </div>
              </div>
            </section>
          </div>
      </>
    )
}