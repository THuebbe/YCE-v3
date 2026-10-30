// The bookings a reset demo loaner starts with. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, sampleOrders, signLinesFor } from './sample-orders';

test('dates are relative to the day the loaner is lent, across month ends', () => {
  assert.equal(addDays('2026-10-30', 3), '2026-11-02');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  const { orders } = sampleOrders('demo_loaner_2', '2026-10-30', 2);
  const byStatus = Object.fromEntries(orders.map(o => [o.status, o.event_date.slice(0, 10)]));
  assert.deepEqual(byStatus, { deployed: '2026-10-30', processing: '2026-11-02', pending: '2026-11-05', completed: '2026-10-23' });
});

test('every order belongs to the loaner, with unique ids and order numbers', () => {
  const { orders, signs } = sampleOrders('demo_loaner_4', '2026-10-30', 4);
  assert.ok(orders.every(o => o.agency_id === 'demo_loaner_4'));
  assert.equal(new Set(orders.map(o => o.id)).size, orders.length);
  assert.equal(new Set(orders.map(o => o.order_number)).size, orders.length);
  assert.equal(new Set(signs.map(s => s.id)).size, signs.length);
  assert.ok(signs.every(s => orders.some(o => o.id === s.order_id)));
  // Different loaners never collide on ids
  const other = sampleOrders('demo_loaner_5', '2026-10-30', 5).orders.map(o => o.id);
  assert.ok(orders.every(o => !other.includes(o.id)));
});

test('sign lines spell the display: repeated letters counted, spaces skipped', () => {
  const lines = Object.fromEntries(signLinesFor('HAPPY BIRTHDAY MIA 7', 'pink').map(l => [l.assetKey, l.quantity]));
  assert.equal(lines['letter-p-classic-pink'], 2);
  assert.equal(lines['letter-a-classic-pink'], 3);
  assert.equal(lines['number-7-classic-pink'], 1);
  assert.equal(Object.values(lines).reduce((a, b) => a + b, 0), 'HAPPYBIRTHDAYMIA7'.length);
});

test('placed before the event, deployed and completed stamps only where they apply', () => {
  for (const o of sampleOrders('demo_loaner_1', '2026-10-30', 1).orders) {
    assert.ok(o.created_at.slice(0, 10) <= o.event_date.slice(0, 10), o.id);
    assert.equal(o.deployed_at !== null, o.status === 'deployed' || o.status === 'completed');
    assert.equal(o.completed_at !== null, o.status === 'completed');
  }
});
