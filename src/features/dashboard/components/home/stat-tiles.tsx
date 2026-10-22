import Link from 'next/link';
import { Lock, TrendingDown, TrendingUp } from 'lucide-react';
import type { DashboardMetrics } from '../../types';

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/**
 * At a glance: order counts on every plan, revenue on Elite. Below the jobs
 * on purpose - the work comes first.
 */
export function StatTiles({ metrics, slug }: { metrics: DashboardMetrics; slug: string }) {
  return (
    <section aria-labelledby="glance-title">
      <h2 id="glance-title" className="mb-3 font-display text-heading font-semibold">At a glance</h2>
      <dl className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
        <Tile label="Open orders" value={String(metrics.openOrders)} />
        <Tile label="Done this month" value={String(metrics.completedOrdersThisMonth)} />
        {metrics.revenueLocked ? (
          <Link
            href={`/${slug}/billing`}
            className="col-span-2 flex items-center gap-3 rounded-card border border-dashed border-line-strong p-4 text-fine transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
          >
            <Lock className="size-5 shrink-0 text-fg-muted" aria-hidden />
            <span>
              <span className="block font-bold">Revenue tracking is on Elite</span>
              <span className="text-fg-muted">See what you made this month and how it compares.</span>
            </span>
          </Link>
        ) : (
          <>
            <Tile label="This month" value={money(metrics.monthlyRevenue)} delta={metrics.monthlyRevenueChange} />
            <Tile label="Last 30 days" value={money(metrics.last30DaysRevenue)} />
          </>
        )}
      </dl>
    </section>
  );
}

function Tile({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <dt className="text-fine text-fg-muted">{label}</dt>
      <dd className="mt-1 font-display text-title font-semibold">{value}</dd>
      {delta !== undefined && delta !== 0 && (
        <dd className="mt-1 text-fine">
          <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-positive' : 'text-danger'}`}>
            {up ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
            {up ? '+' : '−'}{Math.abs(Math.round(delta))}%
          </span>{' '}
          <span className="whitespace-nowrap text-fg-muted">vs last month</span>
        </dd>
      )}
    </div>
  );
}
