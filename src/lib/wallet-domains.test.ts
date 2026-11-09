// Apple Pay / Google Pay domains registered on each agency's Stripe account. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walletHosts } from './wallet-domains';

test('the site and its www twin, either way round', () => {
  assert.deepEqual(walletHosts('yardcard-elite.com'), ['yardcard-elite.com', 'www.yardcard-elite.com']);
  assert.deepEqual(walletHosts('www.yardcard-elite.com'), ['yardcard-elite.com', 'www.yardcard-elite.com']);
});

test('plus the host the page was served from (demo site, previews), once', () => {
  assert.deepEqual(walletHosts('yardcard-elite.com', 'demo.yardcard-elite.com'), ['yardcard-elite.com', 'www.yardcard-elite.com', 'demo.yardcard-elite.com']);
  assert.deepEqual(walletHosts('yardcard-elite.com', 'www.yardcard-elite.com'), ['yardcard-elite.com', 'www.yardcard-elite.com']);
  assert.deepEqual(walletHosts('yardcard-elite.com', 'YCE-v3-abc.vercel.app:443'), ['yardcard-elite.com', 'www.yardcard-elite.com', 'yce-v3-abc.vercel.app']);
});

test('local development registers nothing it can not', () => {
  assert.deepEqual(walletHosts('localhost:3000', 'localhost:3000'), []);
  assert.deepEqual(walletHosts('yardcard-elite.com', '127.0.0.1:3000'), ['yardcard-elite.com', 'www.yardcard-elite.com']);
});
