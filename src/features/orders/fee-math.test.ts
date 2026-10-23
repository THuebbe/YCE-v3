// Late and damage fees after check-in. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFeeAmounts, dayDiff, feeCaps } from './fee-math';

test('days between dates, across months and daylight saving', () => {
  assert.equal(dayDiff('2026-11-07', '2026-11-09'), 2);
  assert.equal(dayDiff('2026-10-31', '2026-11-02'), 2); // DST ends Nov 1
  assert.equal(dayDiff('2026-03-07', '2026-03-09'), 2); // DST starts Mar 8
  assert.equal(dayDiff('2026-11-09', '2026-11-07'), -2);
});

test('fee caps: late fee for each day past pickup, damage fee per sign', () => {
  assert.deepEqual(
    feeCaps({ pickupDay: '2026-11-09', checkInDay: '2026-11-11', lateFee: 25, damagedSigns: 3, damageFeePerSign: 5 }),
    { lateDays: 2, lateMax: 50, damageMax: 15 },
  );
});

test('fee caps: on time or early is never late', () => {
  assert.equal(feeCaps({ pickupDay: '2026-11-09', checkInDay: '2026-11-09', lateFee: 25, damagedSigns: 0, damageFeePerSign: 5 }).lateMax, 0);
  assert.equal(feeCaps({ pickupDay: '2026-11-09', checkInDay: '2026-11-08', lateFee: 25, damagedSigns: 0, damageFeePerSign: 5 }).lateDays, 0);
});

test('fee caps: no pickup or check-in day means no late fee', () => {
  assert.equal(feeCaps({ pickupDay: null, checkInDay: '2026-11-11', lateFee: 25, damagedSigns: 0, damageFeePerSign: 5 }).lateMax, 0);
});

test('fee caps: cents stay exact', () => {
  assert.equal(feeCaps({ pickupDay: null, checkInDay: null, lateFee: 0, damagedSigns: 3, damageFeePerSign: 7.1 }).damageMax, 21.3);
});

const caps = { lateMax: 50, damageMax: 15 };

test('fee amounts: up to the caps is allowed, and lowering is allowed', () => {
  assert.deepEqual(checkFeeAmounts(50, 15, caps), { lateAmount: 50, damageAmount: 15, total: 65 });
  assert.deepEqual(checkFeeAmounts(20, 0, caps), { lateAmount: 20, damageAmount: 0, total: 20 });
  assert.deepEqual(checkFeeAmounts('10.005', '', caps), { lateAmount: 10.01, damageAmount: 0, total: 10.01 });
});

test('fee amounts: never above what the customer agreed to', () => {
  assert.ok('error' in checkFeeAmounts(50.01, 0, caps));
  assert.ok('error' in checkFeeAmounts(0, 16, caps));
});

test('fee amounts: never negative', () => {
  assert.ok('error' in checkFeeAmounts(-1, 0, caps));
  assert.ok('error' in checkFeeAmounts(0, -0.5, caps));
});
