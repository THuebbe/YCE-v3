/**
 * The admin overview's numbers, from rows the server already fetched.
 * Pure, so it's tested without a database (summary.test.ts).
 *
 * "Bookable" is bookingBlockers(), the same rule the booking page
 * enforces, so this page can't disagree with what customers see.
 */
import { bookingBlockers, type ReadinessAgency, type ReadinessItem } from '@/features/agency/readiness';

/** The agency columns the admin pages read. Never braintree_private_key and friends. */
export const ADMIN_AGENCY_COLUMNS = [
  'id', 'name', 'slug', 'email', 'is_active', 'created_at', 'plan',
  'stripe_account_id', 'stripe_account_type', 'stripe_charges_enabled', 'stripe_customer_id',
  'stripe_subscription_id', 'subscription_status', 'subscription_price', 'subscription_trial_end',
  'subscription_current_period_end', 'subscription_cancel_at_period_end', 'subscription_past_due_since',
  'pricing_config',
].join(', ');

export interface AdminAgency extends ReadinessAgency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  is_active: boolean | null;
  created_at: string;
  plan: string | null;
  stripe_account_type: string | null;
  stripe_customer_id: string | null;
}

export interface OrderStub {
  agency_id: string;
  created_at: string;
  status: string | null;
}

export interface AgencyRow {
  agency: AdminAgency;
  blockers: ReadinessItem[];
  orders30d: number;
  ordersTotal: number;
  lastOrderAt: string | null;
}

export interface Attention {
  agency: AdminAgency;
  reason: string;
}

export interface Overview {
  agencies: number;
  inactive: number;
  byPlan: Record<string, number>;
  bySubscription: Record<string, number>;
  bookable: number;
  blockerCounts: Record<ReadinessItem, number>;
  orders7d: number;
  orders30d: number;
  cancelled30d: number;
  attention: Attention[];
}

const DAY = 24 * 60 * 60 * 1000;

// Supabase returns `timestamp without time zone` columns with no offset; they are stored as UTC
const toTime = (iso: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`).getTime();

export function agencyRows(agencies: AdminAgency[], stockedAgencyIds: Set<string>, orders: OrderStub[], now = new Date()): AgencyRow[] {
  const since30 = now.getTime() - 30 * DAY;
  const byAgency = new Map<string, OrderStub[]>();
  for (const o of orders) {
    const list = byAgency.get(o.agency_id);
    if (list) list.push(o);
    else byAgency.set(o.agency_id, [o]);
  }
  return agencies.map(agency => {
    const own = byAgency.get(agency.id) ?? [];
    const last = own.reduce<number | null>((max, o) => Math.max(max ?? 0, toTime(o.created_at)), null);
    return {
      agency,
      blockers: bookingBlockers(agency, stockedAgencyIds.has(agency.id)),
      orders30d: own.filter(o => toTime(o.created_at) >= since30).length,
      ordersTotal: own.length,
      lastOrderAt: last === null ? null : new Date(last).toISOString(),
    };
  });
}

/** Things the owner should look at: money at risk first */
function attentionFor(row: AgencyRow, now: Date): string | null {
  const a = row.agency;
  const status = a.subscription_status ?? 'none';
  if (status === 'past_due') return 'Renewal payment failed';
  if (status === 'unpaid') return 'Subscription unpaid';
  if (a.subscription_cancel_at_period_end && (status === 'active' || status === 'trialing')) return 'Cancels at period end';
  if (status === 'trialing' && a.subscription_trial_end) {
    const days = Math.ceil((toTime(a.subscription_trial_end) - now.getTime()) / DAY);
    if (days >= 0 && days <= 7) return days === 0 ? 'Trial ends today' : `Trial ends in ${days} day${days === 1 ? '' : 's'}`;
  }
  // Paying (or trialing) but customers can't book: they're paying for nothing
  if ((status === 'active' || status === 'trialing') && row.blockers.length) return 'Subscribed but not taking bookings';
  return null;
}

export function overview(rows: AgencyRow[], orders: OrderStub[], now = new Date()): Overview {
  const since7 = now.getTime() - 7 * DAY;
  const since30 = now.getTime() - 30 * DAY;
  const count = (map: Record<string, number>, key: string) => { map[key] = (map[key] ?? 0) + 1; };

  const byPlan: Record<string, number> = {};
  const bySubscription: Record<string, number> = {};
  const blockerCounts: Record<ReadinessItem, number> = { plan: 0, payments: 0, inventory: 0, pricing: 0 };
  const attention: Attention[] = [];

  for (const row of rows) {
    count(byPlan, row.agency.plan ?? 'none');
    count(bySubscription, row.agency.subscription_status ?? 'none');
    for (const b of row.blockers) blockerCounts[b]++;
    const reason = attentionFor(row, now);
    if (reason) attention.push({ agency: row.agency, reason });
  }

  const recent = orders.filter(o => toTime(o.created_at) >= since30);
  return {
    agencies: rows.length,
    inactive: rows.filter(r => r.agency.is_active === false).length,
    byPlan,
    bySubscription,
    bookable: rows.filter(r => r.blockers.length === 0).length,
    blockerCounts,
    orders7d: recent.filter(o => toTime(o.created_at) >= since7).length,
    orders30d: recent.length,
    cancelled30d: recent.filter(o => o.status === 'cancelled').length,
    attention,
  };
}
