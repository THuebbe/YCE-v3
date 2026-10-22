import { UserButton } from '@clerk/nextjs';
import { requireAgencyPage } from '@/features/dashboard/access';
import { AppShell } from '@/features/dashboard/components/app-shell';
import { parseBranding } from '@/features/agency/branding';
import { SITE_URL } from '@/lib/site';

/** The signed-in agency's app: dashboard, orders, signs, settings, billing. Public pages (booking, paid, cancel) sit outside this group. */
export default async function AgencyAppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ agency: string }> }) {
  const { agency: slug } = await params;
  const { agency } = await requireAgencyPage(slug);

  return (
    <AppShell
      slug={slug}
      agencyName={agency.name}
      logoUrl={parseBranding(agency.branding).logoUrl}
      bookingUrl={`${SITE_URL}/${slug}/booking`}
      account={<UserButton />}
    >
      {children}
    </AppShell>
  );
}
