import { BookingWizard } from '@/features/booking/components/booking-wizard';
import { parseBookingPricing } from '@/features/booking/pricing';
import { resolveTimeZone } from '@/features/booking/booking-rules';
import { effectiveBookingRules, effectivePolicies } from '@/features/booking/policies';
import { getAgencyBySlug } from '@/lib/db/supabase-client';
import { notFound } from 'next/navigation';
import { subscriptionAllowsBookings } from '@/features/billing/subscription';

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

  // Refuse to quote rather than invent a price when the agency hasn't set
  // one. An agency without a paid-up subscription doesn't take bookings.
  const pricing = parseBookingPricing(agency.pricing_config);
  if (!pricing || !subscriptionAllowsBookings(agency)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <p className="text-neutral-700">
          This agency isn&apos;t taking online bookings yet. Please contact them directly.
        </p>
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
