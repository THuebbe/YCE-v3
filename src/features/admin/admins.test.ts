// Who may open /admin. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, parseAdminIds } from './admins';

test('nobody is an admin when ADMIN_USER_IDS is unset or empty', () => {
  assert.equal(isAdmin('user_abc', undefined), false);
  assert.equal(isAdmin('user_abc', ''), false);
  assert.equal(isAdmin('user_abc', ' , ,'), false);
});

test('listed ids are admins; spaces around commas are ignored', () => {
  const raw = 'user_abc, user_def ,user_ghi';
  assert.deepEqual([...parseAdminIds(raw)], ['user_abc', 'user_def', 'user_ghi']);
  assert.equal(isAdmin('user_def', raw), true);
});

test('signed out, unlisted, or a partial match is not an admin', () => {
  const raw = 'user_abc';
  assert.equal(isAdmin(null, raw), false);
  assert.equal(isAdmin(undefined, raw), false);
  assert.equal(isAdmin('user_ab', raw), false);
  assert.equal(isAdmin('user_abcd', raw), false);
  assert.equal(isAdmin('', ''), false);
});
