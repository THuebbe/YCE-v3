// Owner alerts: one email per subject per 30 minutes. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertText, shouldSend } from './alerts';

test('the same alert is emailed once per 30 minutes; a different one still goes', () => {
  const sent = new Map<string, number>();
  const t0 = 1_000_000;
  assert.equal(shouldSend('Refund failed', t0, sent), true);
  assert.equal(shouldSend('Refund failed', t0 + 29 * 60_000, sent), false);
  assert.equal(shouldSend('Webhook failed', t0 + 60_000, sent), true);
  assert.equal(shouldSend('Refund failed', t0 + 30 * 60_000, sent), true);
});

test('the email body lists the detail and skips empty values', () => {
  const text = alertText('Refund failed', { order: 'ord_1', error: new Error('card_declined'), extra: null });
  assert.match(text, /^Refund failed\n/);
  assert.match(text, /order: ord_1/);
  assert.match(text, /error: card_declined/);
  assert.doesNotMatch(text, /extra/);
});
