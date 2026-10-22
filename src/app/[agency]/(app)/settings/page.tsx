import { redirect } from 'next/navigation'
import { requireAgencyPage } from '@/features/dashboard/access'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { SectionTabs } from '@/features/dashboard/components/section-tabs'
import { BrandingCard } from '@/features/agency/components/branding-card'
import { parseBranding } from '@/features/agency/branding'
import { AgencyProfileSection } from './components/AgencyProfileSection'
import FinancialManagementSection from './components/FinancialManagementSection'
import AgencySettingsSection from './components/AgencySettingsSection'
import { settingsSections } from './sections'
import { PoliciesCard } from './components/PoliciesCard'
import { parsePolicies } from '@/features/booking/policies'
import { hasFeature, planOf } from '@/features/billing/entitlements'

type Section = 'business' | 'booking' | 'payments'
const SECTIONS: Section[] = ['business', 'booking', 'payments']

interface SettingsPageProps {
  params: Promise<{ agency: string }>
  searchParams: Promise<{
    section?: string
    success?: string
    refresh?: string
    braintree_success?: string
    braintree_refresh?: string
  }>
}

/**
 * Settings in sections, one at a time (?section=); the fourth, Plan &
 * billing, is the /billing page. Stripe Connect comes back to
 * ?section=payments; older return links without a section still land there.
 */
export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { agency: agencySlug } = await params
  const q = await searchParams
  const { agency, user } = await requireAgencyPage(agencySlug)

  // Settings are for the agency's admins
  if (!['ADMIN', 'SUPER_USER', 'SUPER_ADMIN'].includes(user.role)) {
    redirect(`/${agencySlug}/dashboard`)
  }

  const fromProcessor = !!(q.success || q.refresh || q.braintree_success || q.braintree_refresh)
  // Plan & billing is its own page (Stripe Checkout returns there)
  if (q.section === 'plan') redirect(`/${agencySlug}/billing`)
  const section: Section = SECTIONS.includes(q.section as Section) ? (q.section as Section) : fromProcessor ? 'payments' : 'business'
  const plan = planOf(agency)
  const billingHref = `/${agencySlug}/billing`

  return (
    <>
      <PageHeader title="Settings" />
      <SectionTabs label="Settings sections" active={section} items={settingsSections(agencySlug)} />

      <div className="grid gap-6">
        {section === 'business' && <AgencyProfileSection agency={agency} agencySlug={agencySlug} />}

        {section === 'booking' && (
          <>
            <BrandingCard
              agencyId={agency.id}
              agencyName={agency.name}
              initial={parseBranding(agency.branding)}
              canEdit={hasFeature(plan, 'whiteLabel')}
              billingHref={billingHref}
            />
            <FinancialManagementSection agency={agency} show="pricing" />
            <AgencySettingsSection agency={agency} canEditBookingRules={hasFeature(plan, 'policySettings')} />
            <PoliciesCard
              policies={parsePolicies(agency.policy_config, agency.pricing_config)}
              canEdit={hasFeature(plan, 'policySettings')}
              billingHref={billingHref}
            />
          </>
        )}

        {section === 'payments' && (
          <FinancialManagementSection
            agency={agency}
            show="payments"
            stripeReturnSuccess={q.success === 'true'}
            stripeReturnRefresh={q.refresh === 'true'}
            braintreeReturnSuccess={q.braintree_success === 'true'}
            braintreeReturnRefresh={q.braintree_refresh === 'true'}
          />
        )}

      </div>
    </>
  )
}
