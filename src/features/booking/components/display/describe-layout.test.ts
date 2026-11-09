// What the yard picture says to screen readers and browser agents. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeLayout } from './scene-from-layout';
import type { LayoutCalculation, ZoneSign } from '../../types';

const signs = (text: string, kinds?: Partial<Record<number, Partial<ZoneSign>>>): ZoneSign[] =>
  [...text].map((ch, i) => ({
    signId: `s${i}`, zone: 'zone1', position: i, character: ch, style: {},
    type: /\d/.test(ch) ? 'number' : 'letter',
    ...(kinds?.[i] ?? {}),
  }) as ZoneSign);

const layout = (message: ZoneSign[], name: ZoneSign[]) => ({
  zone1: { signs: message }, zone2: { signs: name }, zone3: { signs: [] }, zone4: { signs: [] }, zone5: { signs: [] },
}) as unknown as LayoutCalculation;

test('words read with spaces, as typed', () => {
  assert.equal(describeLayout(layout(signs('HAPPYBIRTHDAY'), signs('JORDAN')), { message: 'Happy Birthday', name: 'Jordan' }), 'HAPPY BIRTHDAY JORDAN');
});

test('the age and its ordinal sign read as one word', () => {
  const message = [...signs('HAPPY'), ...signs('29').map((s, i) => ({ ...s, position: 5 + i })),
    { signId: 'th', zone: 'zone1', position: 7, character: 'TH', type: 'ordinal', isOrdinal: true, style: {} } as ZoneSign,
    ...signs('BIRTHDAY').map((s, i) => ({ ...s, position: 8 + i }))];
  assert.equal(describeLayout(layout(message, signs('JORDAN')), { message: 'Happy Birthday', name: 'Jordan' }), 'HAPPY 29TH BIRTHDAY JORDAN');
});

test('without the typed text it still reads, just without spaces inside a line', () => {
  assert.equal(describeLayout(layout(signs('WELCOMEHOME'), [])), 'WELCOMEHOME');
});
