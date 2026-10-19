import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { graceEndsAt, subscriptionAllowsBookings, type AgencySubscription } from '../subscription';

/**
 * Dashboard notice when the booking page is closed for billing, or about
 * to be (payment failed, inside the grace). Nothing when all is well.
 */
export function BillingBanner({ agency, slug }: { agency: AgencySubscription; slug: string }) {
  const open = subscriptionAllowsBookings(agency);
  const graceEnd = graceEndsAt(agency);
  if (open && !graceEnd) return null;

  const message = !agency.stripe_subscription_id
    ? 'Your booking page is closed until you choose a plan.'
    : open
      ? `Your last subscription payment failed. Update your card by ${graceEnd!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to keep taking bookings.`
      : 'Your booking page is closed to new bookings because your subscription is not paid up.';

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <p className="flex items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {message} Existing orders aren&apos;t affected.
      </p>
      <Link href={`/${slug}/billing`} className="rounded-md bg-amber-900 px-3 py-2 text-sm font-medium text-white">
        {agency.stripe_subscription_id ? 'Fix billing' : 'Choose a plan'}
      </Link>
    </div>
  );
}
