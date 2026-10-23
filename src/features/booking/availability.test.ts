// The configurator's availability rules (PRODUCT.md "Booking configurator").
// Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageElements, nameElements, ordinalSuffix } from './services/line-elements';
import {
  buildablePairs, displayFits, fits, freeCounts, indexStock, lineUsage, pickerOptions,
  unsupportedCharacters, without, type StockSnapshot,
} from './availability';

const text = (els: { value: string }[]) => els.map(e => e.value).join(' ');

test('message elements: the number goes where the preset expects it', () => {
  assert.equal(text(messageElements('Happy Birthday', 40)), 'H A P P Y 4 0 TH B I R T H D A Y');
  assert.equal(text(messageElements('Congratulations', 2)), 'C O N G R A T U L A T I O N S 2 ND');
  assert.equal(text(messageElements('Welcome Home', 3)), 'W E L C O M E H O M E 3 RD');
});

test('message elements: a number typed into the message keeps its ordinal', () => {
  assert.equal(text(messageElements('HAPPY 21ST')), 'H A P P Y 2 1 ST');
  assert.deepEqual(messageElements('Happy 21st').map(e => e.type), ['letter', 'letter', 'letter', 'letter', 'letter', 'number', 'number', 'ordinal']);
});

test('years read without an ordinal: GRADUATION 2026, not 2026TH', () => {
  assert.equal(text(messageElements('Graduation', 2026)), '2 0 2 6 G R A D U A T I O N');
  assert.equal(text(messageElements('Congratulations', 2026)), 'C O N G R A T U L A T I O N S 2 0 2 6');
  assert.equal(text(messageElements('CLASS OF 2026')), 'C L A S S O F 2 0 2 6');
  assert.equal(text(messageElements('Happy Anniversary', 50)), 'H A P P Y 5 0 TH A N N I V E R S A R Y');
});

test('ordinals: 1st 2nd 3rd, but 11th 12th 13th', () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 111].map(ordinalSuffix), ['ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'ST', 'ND', 'TH']);
});

test('name elements: spaces dropped, uppercase', () => {
  assert.equal(text(nameElements('Mary Jo')), 'M A R Y J O');
});

test('unsupported characters are flagged; letters, numbers, punctuation and spaces are fine', () => {
  assert.deepEqual(unsupportedCharacters("Maddie's 1st!"), []);
  assert.deepEqual(unsupportedCharacters('Zoë & José'), ['Ë', 'É']);
});

// A small agency: classic and fun styles, gold and red
function stock(overrides: Record<string, number> = {}): StockSnapshot {
  const signs: StockSnapshot['signs'] = [];
  for (const style of ['classic', 'fun']) {
    for (const colorway of ['gold', 'red']) {
      for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        const id = `${character}-${style}-${colorway}`;
        signs.push({ id, key: id, type: /\d/.test(character) ? 'number' : 'letter', character, style, colorway, quantity: overrides[id] ?? 5 });
      }
    }
  }
  for (const o of ['ST', 'ND', 'RD', 'TH']) signs.push({ id: `ord-${o}`, key: `ord-${o}`, type: 'ordinal', character: o, style: null, colorway: null, quantity: overrides[`ord-${o}`] ?? 2 });
  return { signs, holds: [] };
}

test('repeats count: CONGRATULATIONS JENNY needs 4 N\'s', () => {
  const index = indexStock(stock().signs);
  const pair = { style: 'classic', colorway: 'gold' };
  const message = lineUsage(messageElements('Congratulations'), pair, index)!;
  const name = lineUsage(nameElements('Jenny'), pair, index)!;
  assert.equal(message.get('N-classic-gold'), 2);
  assert.equal(name.get('N-classic-gold'), 2);
});

test('the shared-stock example: 3 classic gold N\'s', () => {
  const snapshot = stock({ 'N-classic-gold': 3 });
  const index = indexStock(snapshot.signs);
  const free = freeCounts(snapshot, '2026-11-06', '2026-11-08');
  const message = messageElements('Congratulations');
  const name = nameElements('Jenny');
  const has = (pairs: { style: string; colorway: string }[], style: string, colorway: string) => pairs.some(p => p.style === style && p.colorway === colorway);

  // Both lines are offered classic gold at first
  assert.ok(has(buildablePairs(message, free, index), 'classic', 'gold'));
  assert.ok(has(buildablePairs(name, free, index), 'classic', 'gold'));

  // The message commits to classic gold (2 N's): it disappears for the name
  const left = without(free, lineUsage(message, { style: 'classic', colorway: 'gold' }, index));
  const namePairs = buildablePairs(name, left, index);
  assert.ok(!has(namePairs, 'classic', 'gold'));
  assert.ok(has(namePairs, 'fun', 'gold') && has(namePairs, 'classic', 'red'));
});

test('pickers: a color hides the styles that can\'t build the line in it, and the other way round', () => {
  const snapshot = stock({ 'J-fun-red': 0 });
  const index = indexStock(snapshot.signs);
  const pairs = buildablePairs(nameElements('Jenny'), freeCounts(snapshot, '2026-11-06', '2026-11-08'), index);
  // Nothing picked: every style and color that works with something
  assert.deepEqual(pickerOptions(pairs, {}), { styles: ['classic', 'fun'], colorways: ['gold', 'red'] });
  // Fun picked: red is hidden (no fun red J)
  assert.deepEqual(pickerOptions(pairs, { style: 'fun' }).colorways, ['gold']);
  // Red picked: fun is hidden
  assert.deepEqual(pickerOptions(pairs, { colorway: 'red' }).styles, ['classic']);
  // Gold picked: both styles still work
  assert.deepEqual(pickerOptions(pairs, { colorway: 'gold' }).styles, ['classic', 'fun']);
});

test('free counts follow the database rule: temporary holds block overlapping days, order holds block from delivery on', () => {
  const snapshot = stock();
  snapshot.holds = [
    { kind: 'temporary', start: '2026-11-06', end: '2026-11-08', mine: false, items: [{ signId: 'A-classic-gold', quantity: 2 }] },
    { kind: 'order', start: '2026-11-01', end: '2026-11-03', mine: false, items: [{ signId: 'B-classic-gold', quantity: 1 }] },
    { kind: 'temporary', start: '2026-11-06', end: '2026-11-08', mine: true, items: [{ signId: 'C-classic-gold', quantity: 5 }] },
  ];
  const nov7 = freeCounts(snapshot, '2026-11-07', '2026-11-07');
  assert.equal(nov7.get('A-classic-gold'), 3); // overlapping temporary hold
  assert.equal(nov7.get('B-classic-gold'), 4); // order delivered earlier, not checked in yet
  assert.equal(nov7.get('C-classic-gold'), 5); // our own hold doesn't block us
  const nov20 = freeCounts(snapshot, '2026-11-20', '2026-11-21');
  assert.equal(nov20.get('A-classic-gold'), 5); // temporary hold is over
  assert.equal(nov20.get('B-classic-gold'), 4); // order hold still out until check-in
  const oct = freeCounts(snapshot, '2026-10-20', '2026-10-25');
  assert.equal(oct.get('B-classic-gold'), 5); // before the order's delivery
});

test('ordinals have no style or color but still count', () => {
  const snapshot = stock({ 'ord-TH': 0 });
  const index = indexStock(snapshot.signs);
  const free = freeCounts(snapshot, '2026-11-06', '2026-11-08');
  assert.deepEqual(buildablePairs(messageElements('Happy Birthday', 40), free, index), []);
  assert.equal(buildablePairs(messageElements('Happy Birthday', 41), free, index).length, 4); // 41ST is fine
});

test('a sign the agency doesn\'t stock at all rules out that pair', () => {
  const snapshot = stock();
  snapshot.signs = snapshot.signs.filter(s => s.id !== 'Q-fun-red');
  const index = indexStock(snapshot.signs);
  assert.equal(lineUsage(nameElements('Quinn'), { style: 'fun', colorway: 'red' }, index), null);
});

test('display fits: says which line is the problem', () => {
  const index = indexStock(stock().signs);
  const free = (o: Record<string, number>) => freeCounts(stock(o), '2026-11-06', '2026-11-08');
  const all = { ...Object.fromEntries(['classic', 'fun'].flatMap(s => ['gold', 'red'].map(c => [`J-${s}-${c}`, 0]))) };
  assert.deepEqual(displayFits(messageElements('Congratulations'), nameElements('Jenny'), free({}), index), { ok: true });
  assert.deepEqual(displayFits(messageElements('Congratulations'), nameElements('Jenny'), free(all), index), { ok: false, reason: 'name' });
  // Only 3 N's in every pair: each line alone fits, both together don't
  const threeNs = Object.fromEntries(['classic', 'fun'].flatMap(s => ['gold', 'red'].map(c => [`N-${s}-${c}`, 3])));
  const onlyOne = { ...threeNs, ...Object.fromEntries(['classic', 'fun'].flatMap(s => ['gold', 'red'].map(c => [`G-${s}-${c}`, 0]))), 'G-classic-gold': 5 };
  assert.deepEqual(displayFits(messageElements('Congratulations'), nameElements('Jenny'), free(onlyOne), index), { ok: true });
  // 2 N's per pair everywhere: the message takes both N's of its pair; the name can use another pair
  assert.deepEqual(displayFits(messageElements('Congratulations'), nameElements('Jenny'), free(threeNs), index), { ok: true });
});

test('display fits: together fails when both lines need the only pair that has the letters', () => {
  // Only classic gold has N's at all (3 of them); every other pair has none
  const index = indexStock(stock().signs);
  const noN = Object.fromEntries(['classic', 'fun'].flatMap(s => ['gold', 'red'].map(c => [`N-${s}-${c}`, 0])));
  const free = freeCounts(stock({ ...noN, 'N-classic-gold': 3 }), '2026-11-06', '2026-11-08');
  assert.deepEqual(displayFits(messageElements('Congratulations'), nameElements('Jenny'), free, index), { ok: false, reason: 'together' });
  assert.ok(fits(lineUsage(nameElements('Jenny'), { style: 'classic', colorway: 'gold' }, index)!, free));
});
