import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/features/admin/access';
import { loadAdminAgency } from '@/features/admin/data';
import {
  BookablePill, Pill, SubscriptionPill, formatDate, formatMoney, stripeAccountUrl, stripeCustomerUrl,
} from '@/features/admin/components/bits';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { agencyBookingUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function AdminAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await loadAdminAgency(id);
  if (!detail) notFound();
  const { agency: a, blockers, users, recentOrders, ordersTotal } = detail;

  return (
    <>
      <Link href="/admin/agencies" className="text-fine text-action-text hover:underline">← All agencies</Link>
      <PageHeader
        className="mt-2"
        title={a.name}
        description={<>/{a.slug}{a.email ? ` · ${a.email}` : ''} · joined {formatDate(a.created_at)}{a.is_active === false && ' · switched off'}</>}
        actions={<a href={agencyBookingUrl(a.slug)} target="_blank" rel="noreferrer" className="rounded-control border border-line-strong px-3 py-2 text-copy hover:bg-surface-sunken">Booking page ↗</a>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Bookings">
          <BookablePill blockers={blockers} />
          <p className="mt-2 text-fine text-fg-muted">Same check the booking page makes: plan, payments, signs in stock, prices.</p>
        </Panel>

        <Panel title="Subscription">
          <div className="flex flex-wrap items-center gap-2">
            <SubscriptionPill status={a.subscription_status} />
            {a.plan && <Pill tone="neutral">{a.plan}</Pill>}
            {a.subscription_cancel_at_period_end && <Pill tone="caution">cancels at period end</Pill>}
          </div>
          <dl className="mt-2 space-y-1 text-fine">
            {a.subscription_trial_end && <Row label="Trial ends">{formatDate(a.subscription_trial_end)}</Row>}
            {a.subscription_current_period_end && <Row label="Period ends">{formatDate(a.subscription_current_period_end)}</Row>}
            {a.subscription_past_due_since && <Row label="Past due since">{formatDate(a.subscription_past_due_since)}</Row>}
          </dl>
          {a.stripe_customer_id && <ExternalLink href={stripeCustomerUrl(a.stripe_customer_id)}>Customer in Stripe</ExternalLink>}
        </Panel>

        <Panel title="Payments">
          {a.stripe_account_id ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Pill tone="neutral">{a.stripe_account_type === 'standard' ? 'Own Stripe (Standard)' : 'Set up by us (Express)'}</Pill>
                <Pill tone={a.stripe_charges_enabled ? 'positive' : 'caution'}>{a.stripe_charges_enabled ? 'Charges enabled' : 'Charges not enabled'}</Pill>
              </div>
              <ExternalLink href={stripeAccountUrl(a.stripe_account_id)}>Connected account in Stripe</ExternalLink>
            </>
          ) : <p className="text-copy text-fg-muted">Stripe not connected.</p>}
        </Panel>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-heading font-semibold">Team</h2>
        {users.length === 0 ? <p className="mt-2 text-copy text-fg-muted">No users linked to this agency.</p> : (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {users.map(u => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{[u.first_name, u.last_name].filter(Boolean).join(' ') || 'No name'}</p>
                  <p className="truncate text-fine text-fg-muted">{u.email ?? 'No email'}</p>
                </div>
                <span className="text-fine text-fg-muted">{u.role?.toLowerCase().replace(/_/g, ' ')} · since {formatDate(u.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-heading font-semibold">Recent orders</h2>
        <p className="mt-1 text-fine text-fg-muted">{ordersTotal} in total; the latest 20 below. Customer details stay in the agency&rsquo;s own dashboard.</p>
        {recentOrders.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {recentOrders.map(o => (
              <li key={o.id} className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 text-fine md:grid-cols-5 md:items-center">
                <span className="font-semibold">{o.order_number ?? o.id.slice(0, 8)}</span>
                <span className="text-fg-muted">placed {formatDate(o.created_at)}</span>
                <span className="text-fg-muted">event {formatDate(o.event_date)}</span>
                <span>{o.status ?? '—'}{o.payment_status ? ` · ${o.payment_status.replace(/_/g, ' ')}` : ''}</span>
                <span className="md:text-right">{formatMoney(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-fine font-semibold uppercase tracking-wide text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-2"><dt className="text-fg-muted">{label}</dt><dd>{children}</dd></div>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-fine text-action-text hover:underline">{children} ↗</a>;
}
