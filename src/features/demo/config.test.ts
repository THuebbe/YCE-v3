// Demo rules shared by client and server. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLoanerAgency, maskEmail } from './config';

test('only demo_loaner_N agencies can be reset by demo code', () => {
  assert.equal(isLoanerAgency('demo_loaner_1'), true);
  assert.equal(isLoanerAgency('demo_loaner_12'), true);
  assert.equal(isLoanerAgency('demo_template_lucky_lawn'), false);
  assert.equal(isLoanerAgency('demo_loaner_'), false);
  assert.equal(isLoanerAgency('demo_loaner_1x'), false);
  assert.equal(isLoanerAgency('cmcpperej000fq8br24m5cd06'), false);
  assert.equal(isLoanerAgency(null), false);
});

test('masked emails keep the first and last letter and the domain', () => {
  assert.equal(maskEmail('jordan@gmail.com'), 'j••••n@gmail.com');
  assert.equal(maskEmail('al@x.io'), 'a•@x.io');
  assert.equal(maskEmail('a@x.io'), 'a•@x.io');
  assert.equal(maskEmail('averyveryverylongname@co.com'), 'a••••••e@co.com');
  assert.equal(maskEmail('nope'), '•••');
});
