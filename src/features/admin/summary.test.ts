// The admin overview's numbers. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agencyRows, overview, type AdminAgency, type OrderStub } from './summary';

const NOW = new Date('2026-10-30T12:00:00Z');

function agency(id: string, extra: Partial<AdminAgency> = {}): AdminAgency {
  return {
    id, name: id, slug: id, email: null, is_active: true, created_at: '2026-10-01T00:00:00',
    plan: 'essentials', stripe_account_type: 'express', stripe_customer_id: 'cus_1',
    stripe_account_id: 'acct_1', stripe_charges_enabled: true,
    stripe_subscription_id: 'sub_1', subscription_status: 'active',
    pricing_config: { basePrice: 85, extraDayPrice: 10 },
    ...extra,
  };
}

const stocked = (...ids: string[]) => new Set(ids);

test('bookable uses the booking page rule: plan, payments, inventory, pricing', () => {
  const rows = agencyRows([
    agency('ready'),
    agency('no-stripe', { stripe_charges_enabled: false }),
    agency('no-sub', { stripe_subscription_id: null, subscription_status: 'none' }),
    agency('no-price', { pricing_config: {} }),
    agency('no-stock'),
  ], stocked('ready', 'no-stripe', 'no-sub', 'no-price'), [], NOW);
  const blockers = Object.fromEntries(rows.map(r => [r.agency.id, r.blockers]));
  assert.deepEqual(blockers, {
    ready: [],
    'no-stripe': ['payments'],
    'no-sub': ['plan'],
    'no-price': ['pricing'],
    'no-stock': ['inventory'],
  });
  const o = overview(rows, [], NOW);
  assert.equal(o.bookable, 1);
  assert.deepEqual(o.blockerCounts, { plan: 1, payments: 1, inventory: 1, pricing: 1 });
});

test('order counts per agency and overall; DB timestamps without an offset are UTC', () => {
  const orders: OrderStub[] = [
    { agency_id: 'a', created_at: '2026-10-29T12:00:00', status: 'pending' },      // 1 day ago
    { agency_id: 'a', created_at: '2026-10-20T12:00:00', status: 'cancelled' },    // 10 days
    { agency_id: 'a', created_at: '2026-08-01T12:00:00', status: 'completed' },    // 90 days
    { agency_id: 'b', created_at: '2026-10-23T11:59:00', status: 'completed' },    // just over 7 days
  ];
  const rows = agencyRows([agency('a'), agency('b'), agency('c')], stocked('a', 'b', 'c'), orders, NOW);
  const a = rows.find(r => r.agency.id === 'a')!;
  assert.equal(a.ordersTotal, 3);
  assert.equal(a.orders30d, 2);
  assert.equal(a.lastOrderAt, '2026-10-29T12:00:00.000Z');
  assert.equal(rows.find(r => r.agency.id === 'c')!.lastOrderAt, null);

  const o = overview(rows, orders, NOW);
  assert.equal(o.orders7d, 1);
  assert.equal(o.orders30d, 3);
  assert.equal(o.cancelled30d, 1);
});

test('attention: failed renewals, cancellations, trials ending within a week, paying but closed', () => {
  const rows = agencyRows([
    agency('fine'),
    agency('past-due', { subscription_status: 'past_due', subscription_past_due_since: '2026-10-29T00:00:00Z' }),
    agency('leaving', { subscription_cancel_at_period_end: true }),
    agency('trial-3d', { subscription_status: 'trialing', subscription_trial_end: '2026-11-02T12:00:00Z' }),
    agency('trial-20d', { subscription_status: 'trialing', subscription_trial_end: '2026-11-19T12:00:00Z' }),
    agency('paying-closed', { stripe_charges_enabled: false }),
    agency('never-subscribed', { stripe_subscription_id: null, subscription_status: 'none', stripe_charges_enabled: false }),
  ], stocked('fine', 'past-due', 'leaving', 'trial-3d', 'trial-20d', 'paying-closed', 'never-subscribed'), [], NOW);
  const reasons = Object.fromEntries(overview(rows, [], NOW).attention.map(a => [a.agency.id, a.reason]));
  assert.deepEqual(reasons, {
    'past-due': 'Renewal payment failed',
    leaving: 'Cancels at period end',
    'trial-3d': 'Trial ends in 3 days',
    'paying-closed': 'Subscribed but not taking bookings',
  });
});

test('plan and subscription tallies treat missing values as "none"', () => {
  const rows = agencyRows([
    agency('a', { plan: 'elite' }),
    agency('b', { plan: null, subscription_status: null, stripe_subscription_id: null }),
    agency('c', { is_active: false }),
  ], stocked(), [], NOW);
  const o = overview(rows, [], NOW);
  assert.deepEqual(o.byPlan, { elite: 1, none: 1, essentials: 1 });
  assert.deepEqual(o.bySubscription, { active: 2, none: 1 });
  assert.equal(o.inactive, 1);
});
