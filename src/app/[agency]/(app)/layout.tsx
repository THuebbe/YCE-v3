import { UserButton } from '@clerk/nextjs';
import { requireAgencyPage } from '@/features/dashboard/access';
import { AppShell } from '@/features/dashboard/components/app-shell';
import { activeBranding } from '@/features/agency/branding';
import { SITE_URL } from '@/lib/site';
import { DemoBanner, EndDemoButton } from '@/features/demo/components/demo-banner';

/** The signed-in agency's app: dashboard, orders, signs, settings, billing. Public pages (booking, paid, cancel) sit outside this group. */
export default async function AgencyAppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ agency: string }> }) {
  const { agency: slug } = await params;
  const { agency, demoEndsAt } = await requireAgencyPage(slug);

  return (
    <AppShell
      slug={slug}
      agencyName={agency.name}
      logoUrl={activeBranding(agency).logoUrl}
      bookingUrl={`${SITE_URL}/${slug}/booking`}
      account={demoEndsAt ? <EndDemoButton /> : <UserButton />}
      banner={demoEndsAt ? <DemoBanner endsAt={demoEndsAt} /> : undefined}
    >
      {children}
    </AppShell>
  );
}
