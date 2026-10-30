import type { ReadinessItem } from '@/features/agency/readiness';
import { cn } from '@/lib/utils';

type Tone = 'positive' | 'caution' | 'danger' | 'notice' | 'neutral';

const TONES: Record<Tone, string> = {
  positive: 'bg-positive-soft text-positive',
  caution: 'bg-caution-soft text-caution',
  danger: 'bg-danger-soft text-danger',
  notice: 'bg-notice-soft text-notice',
  neutral: 'bg-surface-sunken text-fg-muted',
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-control px-2 py-0.5 text-fine font-semibold whitespace-nowrap', TONES[tone])}>
      {children}
    </span>
  );
}

const SUB_TONES: Record<string, Tone> = {
  active: 'positive',
  trialing: 'notice',
  past_due: 'caution',
  unpaid: 'danger',
  canceled: 'neutral',
  incomplete: 'caution',
  incomplete_expired: 'neutral',
  paused: 'neutral',
  none: 'neutral',
};

export function SubscriptionPill({ status }: { status: string | null | undefined }) {
  const s = status ?? 'none';
  return <Pill tone={SUB_TONES[s] ?? 'neutral'}>{s === 'none' ? 'No plan' : s.replace(/_/g, ' ')}</Pill>;
}

const BLOCKER_LABELS: Record<ReadinessItem, string> = {
  plan: 'no paid plan',
  payments: 'payments not set up',
  inventory: 'no signs in stock',
  pricing: 'no prices',
};

export function BookablePill({ blockers }: { blockers: ReadinessItem[] }) {
  if (!blockers.length) return <Pill tone="positive">Taking bookings</Pill>;
  return <Pill tone="caution">Closed: {blockers.map(b => BLOCKER_LABELS[b]).join(', ')}</Pill>;
}

export function blockerLabel(b: ReadinessItem): string {
  return BLOCKER_LABELS[b];
}

// Supabase returns `timestamp without time zone` with no offset; stored as UTC
const parse = (iso: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);

/** The owner is in Iowa: dates read on Central time */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return parse(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
}

export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Stripe dashboard links; previews run on sandbox keys, so their objects live under /test */
const STRIPE_DASHBOARD = `https://dashboard.stripe.com${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? '/test' : ''}`;
export const stripeCustomerUrl = (id: string) => `${STRIPE_DASHBOARD}/customers/${id}`;
export const stripeAccountUrl = (id: string) => `${STRIPE_DASHBOARD}/connect/accounts/${id}`;

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-fine text-fg-muted">{label}</p>
      <p className="mt-1 font-display text-title font-semibold">{value}</p>
      {hint && <p className="mt-1 text-fine text-fg-muted">{hint}</p>}
    </div>
  );
}
