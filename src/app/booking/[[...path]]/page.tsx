import { BookingWizard } from '@/features/booking/components/booking-wizard';

interface BookingPageProps {
  params: Promise<{
    path?: string[];
  }>;
  searchParams: Promise<{
    agency?: string;
    step?: string;
  }>;
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const step = resolvedSearchParams.step ? parseInt(resolvedSearchParams.step) : 1;
  const agencyId = resolvedSearchParams.agency;

  console.log('🎯 Booking Page: Loading booking page', { step, agencyId });

  return (
    <div className="min-h-screen">
      <BookingWizard 
        agencyId={agencyId}
        initialStep={step}
      />
    </div>
  );
}