import Link from 'next/link';
import { requireAdmin } from '@/features/admin/access';
import { loadAdminSummary } from '@/features/admin/data';
import { BookablePill, SubscriptionPill, formatDate } from '@/features/admin/components/bits';
import { PageHeader } from '@/features/dashboard/components/page-header';

export const dynamic = 'force-dynamic';

export default async function AdminAgenciesPage() {
  await requireAdmin();
  const { rows } = await loadAdminSummary();

  return (
    <>
      <PageHeader title="Agencies" description={`${rows.length} in total, newest first.`} />
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {rows.map(({ agency: a, blockers, orders30d, ordersTotal, lastOrderAt }) => (
          <li key={a.id} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] md:items-center">
            <div className="min-w-0">
              <Link href={`/admin/agencies/${a.id}`} className="font-semibold text-action-text hover:underline">{a.name}</Link>
              <p className="truncate text-fine text-fg-muted">
                /{a.slug} · {a.plan ? a.plan.charAt(0).toUpperCase() + a.plan.slice(1) : 'No plan'} · joined {formatDate(a.created_at)}
                {a.is_active === false && ' · switched off'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <SubscriptionPill status={a.subscription_status} />
              <BookablePill blockers={blockers} />
            </div>
            <p className="text-fine text-fg-muted md:text-right">
              {ordersTotal ? <>{orders30d} in 30 days · {ordersTotal} total<br />last {formatDate(lastOrderAt)}</> : 'No orders yet'}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
