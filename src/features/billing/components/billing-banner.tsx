import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { graceEndsAt, subscriptionAllowsBookings, type AgencySubscription } from '../subscription';

/**
 * Dashboard notice when the booking page is closed for billing, or about
 * to be (payment failed, inside the grace). Nothing when all is well.
 */
export function BillingBanner({ agency, slug }: { agency: AgencySubscription; slug: string }) {
  const open = subscriptionAllowsBookings(agency);
  const graceEnd = graceEndsAt(agency);
  // Never subscribed: the setup checklist says so
  if ((open && !graceEnd) || !agency.stripe_subscription_id) return null;

  const message = open
      ? `Your last subscription payment failed. Update your card by ${graceEnd!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to keep taking bookings.`
      : 'Your booking page is closed to new bookings because your subscription is not paid up.';

  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-caution bg-caution-soft p-4 text-caution">
      <p className="flex min-w-0 flex-1 basis-64 items-start gap-2 text-fine">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message} Existing orders aren&apos;t affected.</span>
      </p>
      <Link
        href={`/${slug}/billing`}
        className="inline-flex h-11 items-center rounded-control bg-caution px-4 text-fine font-bold text-on-strong transition-opacity hover:opacity-90 focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        Fix billing
      </Link>
    </div>
  );
}
