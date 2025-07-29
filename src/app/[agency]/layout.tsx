import { notFound } from 'next/navigation';
import { getAgencyBySlug } from '@/lib/db/supabase-client';

interface AgencyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ agency: string }>;
}

export default async function AgencyLayout({ children, params }: AgencyLayoutProps) {
  const resolvedParams = await params;
  const { agency: agencySlug } = resolvedParams;

  // Validate agency exists and is active (for all routes)
  // This layout is now only for public agency routes like booking
  // Authentication will be handled at the individual page level for dashboard routes
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency || !agency.isActive) {
    notFound();
  }

  // Provide agency context to all child pages
  return (
    <div data-agency={agencySlug} data-agency-id={agency.id}>
      {children}
    </div>
  );
}