// Sales tax on bookings (owner, 2026-11-07): one flat rate per agency, added
// on top of the prices or already included in them. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBookingAmounts, calculateBookingTotal, formatTaxRate, parseBookingPricing, parseSalesTax } from './pricing';
import { toCents } from '../../lib/stripe';

const prices = { basePrice: 85, extraDayPrice: 10, lateFee: 25 };

test('no tax: the total is the rental, as before', () => {
  assert.deepEqual(calculateBookingAmounts(prices, 1, 0), { rental: 95, subtotal: 95, tax: 0, total: 95 });
  assert.deepEqual(calculateBookingAmounts({ ...prices, salesTaxRate: 0, taxIncluded: true }), { rental: 85, subtotal: 85, tax: 0, total: 85 });
});

test('added on top: 8.25% of $85 is $7.01, total $92.01', () => {
  const a = calculateBookingAmounts({ ...prices, salesTaxRate: 8.25 });
  assert.deepEqual(a, { rental: 85, subtotal: 85, tax: 7.01, total: 92.01 });
  assert.equal(calculateBookingTotal({ ...prices, salesTaxRate: 8.25 }, 0, 2), 113.66); // 105 + 8.66
});

test('included: $85 stays $85, of which $6.48 is tax', () => {
  const a = calculateBookingAmounts({ ...prices, salesTaxRate: 8.25, taxIncluded: true });
  assert.deepEqual(a, { rental: 85, subtotal: 78.52, tax: 6.48, total: 85 });
  assert.equal(a.subtotal + a.tax, a.total);
});

test('cents are exact for the card charge', () => {
  for (const rate of [6, 7.375, 8.25, 9.5, 10.25]) {
    for (const included of [false, true]) {
      const a = calculateBookingAmounts({ basePrice: 89.99, extraDayPrice: 12.5, lateFee: 0, salesTaxRate: rate, taxIncluded: included }, 1, 1);
      assert.equal(toCents(a.subtotal) + toCents(a.tax), toCents(a.total), `${rate}% included=${included}`);
    }
  }
});

test('an agency that has not answered is not the same as one that charges none', () => {
  assert.equal(parseSalesTax({ basePrice: 85 }), null);
  assert.equal(parseSalesTax(null), null);
  assert.deepEqual(parseSalesTax({ salesTaxRate: 0 }), { rate: 0, included: false });
  assert.deepEqual(parseSalesTax({ salesTaxRate: 8.25, salesTaxIncluded: true }), { rate: 8.25, included: true });
  assert.equal(parseSalesTax({ salesTaxRate: '8.25' }), null);
  assert.equal(parseSalesTax({ salesTaxRate: 25 }), null);
  assert.equal(parseSalesTax({ salesTaxRate: -1 }), null);
});

test('pricing carries the tax answer; unanswered quotes with no tax', () => {
  assert.equal(parseBookingPricing({ basePrice: 85 })!.salesTaxRate, 0);
  const p = parseBookingPricing({ basePrice: 85, extraDayPrice: 10, salesTaxRate: 7.375, salesTaxIncluded: true })!;
  assert.equal(p.salesTaxRate, 7.375);
  assert.equal(p.taxIncluded, true);
});

test('rate label', () => {
  assert.equal(formatTaxRate(8.25), '8.25%');
  assert.equal(formatTaxRate(7.375), '7.375%');
  assert.equal(formatTaxRate(6), '6%');
});

test('order money: rental line, tax, and revenue before tax', async () => {
  const { keptBeforeTax, orderRentalCharges, orderTax } = await import('../orders/client-utils');
  // On top: $85 + $7.01 = $92.01
  const onTop = { total: '92.01', tax_amount: '7.01', tax_rate: '8.25', tax_included: false, refund_amount: 0 };
  assert.equal(orderRentalCharges(onTop), 85);
  assert.equal(keptBeforeTax(onTop), 85);
  // Included: $85, of which $6.48 tax
  const included = { total: 85, tax_amount: 6.48, tax_rate: 8.25, tax_included: true };
  assert.equal(orderRentalCharges(included), 85);
  assert.deepEqual(orderTax(included), { amount: 6.48, rate: 8.25, included: true });
  assert.equal(keptBeforeTax(included), 78.52);
  // Half refunded: half the tax goes back too
  assert.equal(keptBeforeTax({ ...onTop, refund_amount: 46.005 }), 42.5);
  // Older orders: no tax columns
  assert.equal(keptBeforeTax({ total: 95, refund_amount: 20 }), 75);
  assert.equal(orderRentalCharges({ total: 95 }), 95);
});
