// Demo invite tokens and access codes. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeMatches, CODE_LENGTH, hashSecret, isInviteToken, newAccessCode, newInviteToken, normalizeCode } from './tokens';

test('invite tokens are 43 URL-safe characters and never repeat', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const t = newInviteToken();
    assert.ok(isInviteToken(t), t);
    seen.add(t);
  }
  assert.equal(seen.size, 200);
  assert.equal(isInviteToken('short'), false);
  assert.equal(isInviteToken('a'.repeat(42) + '/'), false);
});

test('access codes avoid look-alike characters', () => {
  for (let i = 0; i < 500; i++) {
    const c = newAccessCode();
    assert.equal(c.length, CODE_LENGTH);
    assert.match(c, /^[A-HJKMNP-Z2-9]+$/);
  }
});

test('a typed code matches regardless of case, spaces and dashes', () => {
  const stored = hashSecret('K7M2QX');
  assert.equal(codeMatches('k7m2qx', stored), true);
  assert.equal(codeMatches(' K7M-2QX ', stored), true);
  assert.equal(normalizeCode('k7 m2-qx'), 'K7M2QX');
});

test('a wrong, empty or unset code never matches', () => {
  const stored = hashSecret('K7M2QX');
  assert.equal(codeMatches('K7M2QY', stored), false);
  assert.equal(codeMatches('', stored), false);
  assert.equal(codeMatches('K7M2QX', null), false);
  assert.equal(codeMatches('K7M2QX', 'abc'), false);
});
