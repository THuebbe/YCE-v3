import { BookingWizard } from '@/features/booking/components/booking-wizard';
import { getAgencyBySlug } from '@/lib/db/supabase-client';
import { notFound } from 'next/navigation';

interface BookingPageProps {
  params: Promise<{
    agency: string;
    path?: string[];
  }>;
  searchParams: Promise<{
    step?: string;
  }>;
}

export default async function AgencyBookingPage({ params, searchParams }: BookingPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const { agency: agencySlug } = resolvedParams;
  const step = resolvedSearchParams.step ? parseInt(resolvedSearchParams.step) : 1;

  // Verify the agency exists and is accepting bookings
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency || !agency.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <BookingWizard 
        agencyId={agency.id}
        initialStep={step}
      />
    </div>
  );
}