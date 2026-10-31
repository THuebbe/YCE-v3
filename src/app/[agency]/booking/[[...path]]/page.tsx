import { BookingWizard } from '@/features/booking/components/booking-wizard';
import { parseBookingPricing } from '@/features/booking/pricing';
import { resolveTimeZone } from '@/features/booking/booking-rules';
import { effectiveBookingRules, effectivePolicies } from '@/features/booking/policies';
import { getAgencyBySlug } from '@/lib/db/supabase-client';
import { notFound } from 'next/navigation';
import { getBookingBlockers } from '@/features/agency/readiness-server';
import { activeBranding } from '@/features/agency/branding';
import { BookingFrame } from '@/features/booking/components/booking-frame';
import { isDemoMode, TEST_CARD } from '@/features/demo/config';

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
  const branding = activeBranding(agency);
  if (!pricing || blockers.length > 0) {
    return (
      <BookingFrame agencyName={agency.name} branding={branding}>
        <div className="mx-auto grid max-w-md gap-2 px-4 py-16 text-center">
          <h1 className="font-display text-title font-semibold">Online booking isn&apos;t open yet</h1>
          <p className="text-copy text-fg-muted">{agency.name} isn&apos;t taking bookings here yet. Reach them directly:</p>
          {agency.phone && <a href={`tel:${agency.phone}`} className="font-bold text-action-text underline underline-offset-4">{agency.phone}</a>}
          {agency.email && <a href={`mailto:${agency.email}`} className="font-bold text-action-text underline underline-offset-4">{agency.email}</a>}
        </div>
      </BookingFrame>
    );
  }

  const policies = effectivePolicies(agency);

  return (
    <>
    {/* Demo site: prospects (and anyone they send the link to) need the test card */}
    {isDemoMode() && (
      <div className="bg-highlight/15 px-4 py-2 text-center text-fine">
        <strong>Demo booking page</strong>: no real charges. Pay with test card <span className="whitespace-nowrap font-semibold">{TEST_CARD}</span>, any future date and CVC.
      </div>
    )}
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
        branding={branding}
      />
    </>
  );
}
