import Link from 'next/link';
import { requireAdmin } from '@/features/admin/access';
import { loadAdminSummary } from '@/features/admin/data';
import { Stat, SubscriptionPill, blockerLabel } from '@/features/admin/components/bits';
import { PageHeader } from '@/features/dashboard/components/page-header';
import type { ReadinessItem } from '@/features/agency/readiness';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  await requireAdmin();
  const { overview: o } = await loadAdminSummary();
  const closedReasons = (Object.entries(o.blockerCounts) as [ReadinessItem, number][]).filter(([, n]) => n > 0);

  return (
    <>
      <PageHeader title="Overview" description="Every agency on YardCard Elite. Plans, coupons and refunds are changed in Stripe." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Agencies" value={o.agencies} hint={o.inactive ? `${o.inactive} switched off` : undefined} />
        <Stat label="Taking bookings" value={o.bookable} hint={`of ${o.agencies}`} />
        <Stat label="Orders, last 7 days" value={o.orders7d} />
        <Stat label="Orders, last 30 days" value={o.orders30d} hint={o.cancelled30d ? `${o.cancelled30d} cancelled` : undefined} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-heading font-semibold">Needs attention</h2>
        {o.attention.length === 0 ? (
          <p className="mt-2 text-copy text-fg-muted">Nothing right now.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {o.attention.map(({ agency, reason }) => (
              <li key={agency.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/admin/agencies/${agency.id}`} className="font-semibold text-action-text hover:underline">{agency.name}</Link>
                <span className="text-copy text-fg-muted">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section>
          <h2 className="font-display text-heading font-semibold">Plans</h2>
          <Tally entries={Object.entries(o.byPlan).map(([k, n]) => [k === 'none' ? 'No plan' : capitalize(k), n])} />
        </section>
        <section>
          <h2 className="font-display text-heading font-semibold">Subscriptions</h2>
          <ul className="mt-3 space-y-2">
            {Object.entries(o.bySubscription).sort((a, b) => b[1] - a[1]).map(([status, n]) => (
              <li key={status} className="flex items-center justify-between"><SubscriptionPill status={status} /><span className="font-semibold">{n}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-heading font-semibold">Why agencies are closed</h2>
          {closedReasons.length === 0
            ? <p className="mt-2 text-copy text-fg-muted">Every agency is taking bookings.</p>
            : <Tally entries={closedReasons.map(([k, n]) => [capitalize(blockerLabel(k)), n])} />}
        </section>
      </div>
    </>
  );
}

function Tally({ entries }: { entries: [string, number][] }) {
  return (
    <ul className="mt-3 space-y-2 text-copy">
      {entries.sort((a, b) => b[1] - a[1]).map(([label, n]) => (
        <li key={label} className="flex justify-between"><span>{label}</span><span className="font-semibold">{n}</span></li>
      ))}
    </ul>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
