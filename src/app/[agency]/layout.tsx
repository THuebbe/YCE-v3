import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getAgencyBySlug } from '@/lib/db/supabase-client';

interface AgencyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ agency: string }>;
}

export default async function AgencyLayout({ children, params }: AgencyLayoutProps) {
  const resolvedParams = await params;
  const { agency: agencySlug } = resolvedParams;
  
  // Get current user
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  // Validate agency exists and is active
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency || !agency.isActive) {
    notFound();
  }

  // TODO: Add user access validation
  // For now, we'll assume if the user is authenticated and agency exists, they have access
  // In production, you'd want to check if the user belongs to this agency

  // Provide agency context to all child pages
  return (
    <div data-agency={agencySlug} data-agency-id={agency.id}>
      {children}
    </div>
  );
}