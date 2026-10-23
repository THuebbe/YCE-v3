// Booking and cancellation money math. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBookingTotal, parseBookingPricing, DEFAULT_LATE_FEE } from './pricing';
import { agencyRefund, cancellationFee, cancellationPolicyOf, customerRefund, feesPolicyOf, TERMS_DEFAULTS } from './terms';
import { parsePolicies, POLICY_LIMITS } from './policies';
import { applicationFeeCents, toCents } from '../../lib/stripe';

const pricing = { basePrice: 95, extraDayPrice: 15, lateFee: 25 };
const defaults = TERMS_DEFAULTS.cancellation; // 48h, 15% or $20, whichever is more

test('booking total: base price plus each extra day, before or after', () => {
  assert.equal(calculateBookingTotal(pricing), 95);
  assert.equal(calculateBookingTotal(pricing, 1, 0), 110);
  assert.equal(calculateBookingTotal(pricing, 0, 2), 125);
  assert.equal(calculateBookingTotal(pricing, 2, 3), 170);
});

test('booking total: cents add up exactly', () => {
  assert.equal(toCents(calculateBookingTotal({ basePrice: 89.99, extraDayPrice: 12.5, lateFee: 0 }, 1, 1)), 11499);
});

test('pricing: refuses to quote without a real base price', () => {
  assert.equal(parseBookingPricing(null), null);
  assert.equal(parseBookingPricing({}), null);
  assert.equal(parseBookingPricing({ basePrice: 0 }), null);
  assert.equal(parseBookingPricing({ basePrice: -5 }), null);
  assert.equal(parseBookingPricing({ basePrice: 'abc' }), null);
  assert.equal(parseBookingPricing({ basePrice: 95, extraDayPrice: -1 }), null);
});

test('pricing: reads stored values, numbers stored as text included', () => {
  assert.deepEqual(parseBookingPricing({ basePrice: '95', extraDayPrice: '15', lateFee: '30' }), { basePrice: 95, extraDayPrice: 15, lateFee: 30 });
  assert.deepEqual(parseBookingPricing({ basePrice: 95 }), { basePrice: 95, extraDayPrice: 0, lateFee: DEFAULT_LATE_FEE });
  assert.equal(parseBookingPricing({ basePrice: 95, lateFee: -3 })!.lateFee, DEFAULT_LATE_FEE);
});

test('cancellation fee: the percentage or the minimum, whichever is more', () => {
  assert.equal(cancellationFee(100, defaults), 20); // 15% = $15 < $20 minimum
  assert.equal(cancellationFee(200, defaults), 30); // 15% = $30
  assert.equal(cancellationFee(133.33, defaults), 20);
  assert.equal(cancellationFee(333.33, defaults), 50); // 49.9995 rounds to cents
});

test('cancellation fee: never more than the order total', () => {
  assert.equal(cancellationFee(10, defaults), 10);
  assert.equal(cancellationFee(0, defaults), 0);
});

test('cancellation fee: an agency can set no fee at all', () => {
  assert.equal(cancellationFee(150, { noticeHours: 24, feePercent: 0, feeMinimum: 0 }), 0);
});

test('customer refund: outside the notice window, the total minus the fee', () => {
  assert.deepEqual(customerRefund(110, defaults, 72), { insideNotice: false, fee: 20, refund: 90 });
  assert.deepEqual(customerRefund(200, defaults, 48), { insideNotice: false, fee: 30, refund: 170 }); // exactly 48h still counts
});

test('customer refund: inside the notice window, nothing back', () => {
  assert.deepEqual(customerRefund(110, defaults, 47.9), { insideNotice: true, fee: 110, refund: 0 });
  assert.deepEqual(customerRefund(110, defaults, -5), { insideNotice: true, fee: 110, refund: 0 }); // delivery day already started
});

test('customer refund: never negative, even when the fee is the whole order', () => {
  assert.equal(customerRefund(15, defaults, 100).refund, 0);
});

test('customer refund: no notice rule means any time before delivery', () => {
  const anyTime = { noticeHours: 0, feePercent: 0, feeMinimum: 0 };
  assert.deepEqual(customerRefund(95, anyTime, 1), { insideNotice: false, fee: 0, refund: 95 });
});

test('agency refund: kept between $0 and the order total', () => {
  assert.equal(agencyRefund('none', 50, 110), 0);
  assert.equal(agencyRefund('full', 110, 110), 110);
  assert.equal(agencyRefund('partial', 90, 110), 90);
  assert.equal(agencyRefund('partial', 500, 110), 110);
  assert.equal(agencyRefund('partial', -20, 110), 0);
  assert.equal(agencyRefund('partial', '45.678', 110), 45.68);
  assert.equal(agencyRefund('partial', 'oops', 110), 0);
});

test('saved terms: an order keeps the cancellation rules it was booked under', () => {
  const saved = { cancellation: { noticeHours: 72, feePercent: 10, feeMinimum: 5 } };
  assert.deepEqual(cancellationPolicyOf(saved), saved.cancellation);
  // Orders from before policies were saved use the old terms
  assert.deepEqual(cancellationPolicyOf(null), { noticeHours: 24, feePercent: 5, feeMinimum: 0 });
  assert.deepEqual(cancellationPolicyOf({ cancellation: { noticeHours: 72 } }), { noticeHours: 24, feePercent: 5, feeMinimum: 0 });
});

test('saved terms: late and damage fee amounts, or null for older orders', () => {
  assert.deepEqual(feesPolicyOf({ fees: { lateFee: 25, damageFeePerSign: 5 } }), { lateFee: 25, damageFeePerSign: 5 });
  assert.equal(feesPolicyOf({}), null);
  assert.equal(feesPolicyOf({ fees: { lateFee: '25', damageFeePerSign: 5 } }), null);
});

test('agency policies: stored values are kept inside the allowed limits', () => {
  const p = parsePolicies({ noticeHours: 9999, feePercent: 150, feeMinimum: -10, damageFeePerSign: 7.555 }, { lateFee: 1000 });
  assert.equal(p.cancellation.noticeHours, POLICY_LIMITS.noticeHours.max);
  assert.equal(p.cancellation.feePercent, 100);
  assert.equal(p.cancellation.feeMinimum, 0);
  assert.equal(p.lateFee, POLICY_LIMITS.lateFee.max);
  assert.equal(p.damageFeePerSign, 7.56);
});

test('agency policies: gaps fall back to the defaults', () => {
  assert.deepEqual(parsePolicies(null), { cancellation: defaults, lateFee: DEFAULT_LATE_FEE, damageFeePerSign: TERMS_DEFAULTS.damageFeePerSign });
  assert.equal(parsePolicies({ feePercent: '' }).cancellation.feePercent, defaults.feePercent);
});

test('platform fee: $3 on turnkey (Express) accounts, nothing on their own Stripe', () => {
  assert.equal(applicationFeeCents('express'), 300);
  assert.equal(applicationFeeCents('standard'), 0);
  assert.equal(applicationFeeCents(null), 0);
});

test('cents: dollars convert without floating-point drift', () => {
  assert.equal(toCents(0.1 + 0.2), 30);
  assert.equal(toCents(19.99), 1999);
  assert.equal(toCents(110 - 16.5), 9350); // a refund after a 15% fee
  assert.equal(toCents(33.33 * 3), 9999);
});
