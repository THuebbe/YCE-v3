import type { Metadata } from 'next'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { SectionTabs } from '@/features/dashboard/components/section-tabs'
import { BrandingCard } from '@/features/agency/components/branding-card'
import { parseBranding } from '@/features/agency/branding'
import { AgencyProfileSection } from '@/app/[agency]/(app)/settings/components/AgencyProfileSection'
import FinancialManagementSection from '@/app/[agency]/(app)/settings/components/FinancialManagementSection'
import AgencySettingsSection from '@/app/[agency]/(app)/settings/components/AgencySettingsSection'
import { PoliciesCard } from '@/app/[agency]/(app)/settings/components/PoliciesCard'
import { parsePolicies } from '@/features/booking/policies'
import { LabShell } from '../lab-shell'

export const metadata: Metadata = { title: 'Settings - lab' }

const AGENCY = {
  id: 'lab', slug: 'lab', name: 'Lucky Lawn Signs', email: 'hello@luckylawn.example', phone: '(515) 555-0100',
  plan: 'elite', branding: {}, pricing_config: { basePrice: 95, extraDayPrice: 15, lateFee: 25 }, policy_config: null,
}

/**
 * Settings with a demo agency (preview and dev only). The sections load and
 * save through the real APIs, which refuse here, so they show their
 * loading or error states; the branding card works fully in the browser.
 *   ?section=business|booking|payments
 *   ?plan=essentials       branding locked
 *   ?brand=6B2D8C&accent=FFB703&logo=https://...   start from these
 */
export default async function SettingsLabPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  const section = q.section === 'business' || q.section === 'payments' ? q.section : 'booking'
  const elite = q.plan !== 'essentials'
  const sections = [
    { id: 'business', label: 'Business', href: '/lab/settings?section=business' },
    { id: 'booking', label: 'Booking page', href: '/lab/settings?section=booking' },
    { id: 'payments', label: 'Payments', href: '/lab/settings?section=payments' },
    { id: 'plan', label: 'Plan & billing', href: '/lab/settings?section=plan' },
  ]
  return (
    <LabShell>
      <PageHeader title="Settings" />
      <SectionTabs label="Settings sections" active={section} items={sections} />
      <p className="mb-5 rounded-control bg-notice-soft p-3 text-fine text-notice">
        Demo agency: saving is switched off here, so saves say you don&apos;t have access. Use your own Settings page to save for real.
      </p>
      <div className="grid gap-6">
        {section === 'business' && <AgencyProfileSection agency={AGENCY as any} agencySlug="lab" />}
        {section === 'booking' && (
          <>
            <BrandingCard
              agencyId="lab"
              agencyName={AGENCY.name}
              initial={parseBranding({ brandColor: q.brand && `#${q.brand}`, accentColor: q.accent && `#${q.accent}`, logoUrl: q.logo })}
              canEdit={elite}
              billingHref="/lab/settings?section=plan"
            />
            <FinancialManagementSection agency={AGENCY as any} show="pricing" />
            <AgencySettingsSection agency={AGENCY as any} canEditBookingRules={elite} />
            <PoliciesCard policies={parsePolicies(null, AGENCY.pricing_config)} canEdit={elite} billingHref="/lab/settings?section=plan" />
          </>
        )}
        {section === 'payments' && <FinancialManagementSection agency={AGENCY as any} show="payments" />}
      </div>
    </LabShell>
  )
}
