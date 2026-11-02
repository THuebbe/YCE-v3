// The pick ticket's bins and wording. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickBins } from './pick-ticket';
import { messageWords } from '@/features/booking/services/line-elements';

const letter = (character: string, colorway: string, quantity = 1, sign_type = 'letter') =>
  ({ signId: `${character}-${colorway}`, quantity, sign: { name: `${character} (classic/${colorway})`, category: 'Letters', character, style: 'classic', colorway, sign_type } });
const other = (name: string, category: string, quantity = 1, character: string | null = null) =>
  ({ signId: name, quantity, sign: { name, category, character, style: null, colorway: null, sign_type: category.toLowerCase() } });

test('bins: one per style and color (letters A-Z, then numbers), then ordinals, then decorations', () => {
  const bins = pickBins([
    other('Guitar', 'Decorations', 2), letter('P', 'gold', 2), letter('9', 'gold', 1, 'number'), letter('A', 'gold', 2),
    letter('E', 'red'), other('Ordinal TH', 'Ordinals', 1, 'TH'), letter('2', 'gold', 1, 'number'), other('Disco Ball', 'Decorations', 2),
  ] as never);
  assert.deepEqual(bins.map(b => b.title), ['Classic · Gold', 'Classic · Red', 'Ordinals (ST, ND, RD, TH)', 'Decorations']);
  assert.deepEqual(bins[0].items.map(i => i.label), ['A', 'P', '2', '9']);
  assert.equal(bins[0].count, 6);
  assert.ok(bins[0].swatch);
  assert.deepEqual(bins[2].items, [{ label: 'TH', quantity: 1 }]);
  assert.deepEqual(bins[3].items.map(i => i.label), ['Disco Ball', 'Guitar']);
});

test('message words read like the yard: number and suffix where the signs go', () => {
  assert.equal(messageWords('Happy Birthday', 29), 'HAPPY 29TH BIRTHDAY');
  assert.equal(messageWords('Happy Birthday', 29, 'number'), 'HAPPY 29 BIRTHDAY');
  assert.equal(messageWords('Congratulations', 2), 'CONGRATULATIONS 2ND');
  assert.equal(messageWords('Graduation', 2026), '2026 GRADUATION');
  assert.equal(messageWords('Welcome Home'), 'WELCOME HOME');
});
