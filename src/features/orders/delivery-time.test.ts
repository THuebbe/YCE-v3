// When cancellation notice runs out: measured to delivery-day midnight on the
// agency's clock, not the server's (UTC on Vercel). Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hoursUntilDelivery, startOfDayIn } from './client-utils';
import { customerRefund, TERMS_DEFAULTS } from '../booking/terms';

const at = (iso: string) => new Date(iso);

test('local midnight in a time zone, summer and winter', () => {
  assert.equal(startOfDayIn(2026, 7, 4, 'America/Chicago').toISOString(), '2026-07-04T05:00:00.000Z'); // CDT
  assert.equal(startOfDayIn(2026, 11, 7, 'America/Chicago').toISOString(), '2026-11-07T06:00:00.000Z'); // CST
  assert.equal(startOfDayIn(2026, 11, 7, 'America/Los_Angeles').toISOString(), '2026-11-07T08:00:00.000Z');
  assert.equal(startOfDayIn(2026, 11, 7, 'UTC').toISOString(), '2026-11-07T00:00:00.000Z');
});

test('local midnight on the days the clocks change', () => {
  assert.equal(startOfDayIn(2026, 3, 8, 'America/Chicago').toISOString(), '2026-03-08T06:00:00.000Z'); // spring forward at 2am
  assert.equal(startOfDayIn(2026, 11, 1, 'America/Chicago').toISOString(), '2026-11-01T05:00:00.000Z'); // fall back at 2am
});

test('hours until delivery count to the agency\'s midnight', () => {
  const order = { event_date: '2026-11-07' };
  // Thursday 6am Central = 48 hours before Saturday midnight Central
  assert.equal(hoursUntilDelivery(order, 'America/Chicago', at('2026-11-05T12:00:00Z')), 42);
  assert.equal(hoursUntilDelivery(order, 'America/Chicago', at('2026-11-05T06:00:00Z')), 48);
});

test('extra days before move delivery earlier, across a month boundary too', () => {
  assert.equal(hoursUntilDelivery({ event_date: '2026-11-07', extra_days_before: 1 }, 'America/Chicago', at('2026-11-05T06:00:00Z')), 24);
  assert.equal(hoursUntilDelivery({ event_date: '2026-12-01', extra_days_before: 2 }, 'UTC', at('2026-11-27T00:00:00Z')), 48);
});

test('the bug this fixes: 46 hours out on the agency\'s clock still gets a refund', () => {
  // 2am Thursday Central: 46h to Saturday midnight Central, but only 40h to
  // Saturday midnight UTC. With a 45-hour notice rule the old server-clock
  // math said no refund; the terms say the customer is in time.
  const now = at('2026-11-05T08:00:00Z');
  const order = { event_date: '2026-11-07' };
  const policy = { ...TERMS_DEFAULTS.cancellation, noticeHours: 45 };
  assert.equal(hoursUntilDelivery(order, 'America/Chicago', now), 46);
  assert.equal(customerRefund(110, policy, hoursUntilDelivery(order, 'America/Chicago', now)).refund, 90);
  assert.equal(hoursUntilDelivery(order, 'UTC', now), 40);
  assert.equal(customerRefund(110, policy, hoursUntilDelivery(order, 'UTC', now)).refund, 0);
});

test('no event date: never inside the window', () => {
  assert.equal(hoursUntilDelivery({ event_date: null }, 'America/Chicago'), Infinity);
});

test('an unknown time zone falls back instead of crashing', () => {
  assert.ok(Number.isFinite(hoursUntilDelivery({ event_date: '2026-11-07' }, 'Not/AZone', at('2026-11-05T00:00:00Z'))));
});
