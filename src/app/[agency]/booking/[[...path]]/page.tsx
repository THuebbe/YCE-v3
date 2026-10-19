import { BookingWizard } from '@/features/booking/components/booking-wizard';
import { parseBookingPricing } from '@/features/booking/pricing';
import { resolveTimeZone } from '@/features/booking/booking-rules';
import { effectiveBookingRules, effectivePolicies } from '@/features/booking/policies';
import { getAgencyBySlug } from '@/lib/db/supabase-client';
import { notFound } from 'next/navigation';
import { getBookingBlockers } from '@/features/agency/readiness-server';

interface BookingPageProps {
  params: Promise<{
    agency: string;
    path?: string[];
  }>;
}

export default async function AgencyBookingPage({ params }: BookingPageProps) {
  const resolvedParams = await params;
  
  const { agency: agencySlug } = resolvedParams;

  // Verify the agency exists and is accepting bookings
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency || !agency.is_active) {
    notFound();
  }

  // Closed until the agency is set up to be paid: a paid-up plan, card
  // payments, signs in stock and prices (never an invented price)
  const pricing = parseBookingPricing(agency.pricing_config);
  const blockers = await getBookingBlockers(agency);
  if (!pricing || blockers.length > 0) {
    const contact = [agency.phone, agency.email].filter(Boolean).join(' · ');
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-lg font-medium text-neutral-900">{agency.name}</p>
          <p className="text-neutral-700">
            This agency isn&apos;t taking online bookings yet. Please contact them directly.
          </p>
          {contact && <p className="text-neutral-600">{contact}</p>}
        </div>
      </div>
    );
  }

  const policies = effectivePolicies(agency);

  return (
    <div className="min-h-screen">
      <BookingWizard 
        agencyId={agency.id}
        agencySlug={agency.slug}
        agency={{
          name: agency.name,
          email: agency.email || undefined,
          phone: agency.phone || undefined,
          website: agency.domain || undefined,
        }}
        pricing={{ ...pricing, lateFee: policies.lateFee }}
        policies={policies}
        bookingRules={effectiveBookingRules(agency)}
        agencyTimeZone={resolveTimeZone(agency.operating_hours)}
      />
    </div>
  );
}
