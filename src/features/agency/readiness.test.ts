// When a booking page opens. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingBlockers, type ReadinessAgency } from './readiness';
import { totalCoversFee } from '@/lib/platform-fee';

function agency(extra: Partial<ReadinessAgency> = {}): ReadinessAgency {
  return {
    stripe_subscription_id: 'sub_1', subscription_status: 'active',
    stripe_account_id: 'acct_1', stripe_charges_enabled: true, stripe_account_type: 'express',
    pricing_config: { basePrice: 95, extraDayPrice: 15, lateFee: 25, salesTaxRate: 0 },
    ...extra,
  } as ReadinessAgency;
}

test('the $3 fee needs a total of at least $5 on the turnkey plan only', () => {
  assert.equal(totalCoversFee(499, 'express'), false);
  assert.equal(totalCoversFee(500, 'express'), true);
  assert.equal(totalCoversFee(100, 'standard'), true);
  assert.equal(totalCoversFee(100, null), true);
});

test('a ready agency has no blockers', () => {
  assert.deepEqual(bookingBlockers(agency(), true), []);
});

test('a turnkey base price below the fee minimum keeps the page closed on pricing', () => {
  const cheap = { pricing_config: { basePrice: 1, extraDayPrice: 1, lateFee: 25, salesTaxRate: 0 } };
  assert.deepEqual(bookingBlockers(agency(cheap), true), ['pricing']);
  assert.deepEqual(bookingBlockers(agency({ ...cheap, stripe_account_type: 'standard' }), true), []);
});

test('Stripe still reviewing and no stock both block', () => {
  assert.deepEqual(bookingBlockers(agency({ stripe_charges_enabled: false }), false), ['payments', 'inventory']);
});

test('sales tax needs an answer: a rate, or 0 for "I don\'t charge it"', () => {
  assert.deepEqual(bookingBlockers(agency({ pricing_config: { basePrice: 95, extraDayPrice: 15 } }), true), ['tax']);
  assert.deepEqual(bookingBlockers(agency({ pricing_config: { basePrice: 95, salesTaxRate: 8.25, salesTaxIncluded: true } }), true), []);
  assert.deepEqual(bookingBlockers(agency({ pricing_config: null }), true), ['pricing', 'tax']);
});
