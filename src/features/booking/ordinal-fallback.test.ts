// How the age's suffix (29TH) shows when stock is short (owner, 2026-11-02):
// the ordinal sign, else plain letters in the name's color, else the number
// alone. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageElements, nameElements, withOrdinalMode } from './services/line-elements';
import { bestOrdinalMode, freeCounts, indexStock, lineUsage, type StockSnapshot } from './availability';

const text = (els: { value: string }[]) => els.map(e => e.value).join('');

// One style, gold and red letters and numbers (5 each), plus ordinal signs
function stock(overrides: Record<string, number> = {}, ordinals = 2): StockSnapshot {
  const signs: StockSnapshot['signs'] = [];
  for (const colorway of ['gold', 'red']) {
    for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      const id = `${character}-${colorway}`;
      signs.push({ id, key: id, type: /\d/.test(character) ? 'number' : 'letter', character, style: 'classic', colorway, quantity: overrides[id] ?? 5 });
    }
  }
  for (const o of ['ST', 'ND', 'RD', 'TH']) signs.push({ id: `ord-${o}`, key: `ord-${o}`, type: 'ordinal', character: o, style: null, colorway: null, quantity: overrides[`ord-${o}`] ?? ordinals });
  return { signs, holds: [] };
}

const best = (snapshot: StockSnapshot, message: string, age: number | undefined, name: string) =>
  bestOrdinalMode(messageElements(message, age), nameElements(name), freeCounts(snapshot, '2026-11-14', '2026-11-15'), indexStock(snapshot.signs));

test('the modes: sign as is, letters counted with the name, number drops the suffix', () => {
  const lines = { message: messageElements('Happy Birthday', 29), name: nameElements('Jordan') };
  assert.equal(text(withOrdinalMode(lines, 'sign').message), 'HAPPY29THBIRTHDAY');
  assert.equal(text(withOrdinalMode(lines, 'letters').message), 'HAPPY29BIRTHDAY');
  assert.equal(text(withOrdinalMode(lines, 'letters').name), 'JORDANTH');
  assert.equal(text(withOrdinalMode(lines, 'number').message), 'HAPPY29BIRTHDAY');
  assert.equal(text(withOrdinalMode(lines, 'number').name), 'JORDAN');
});

test('no name line: the suffix letters stay in the message, in its color', () => {
  const lines = { message: messageElements('Happy Birthday', 29), name: [] };
  assert.equal(text(withOrdinalMode(lines, 'letters').message), 'HAPPY29THBIRTHDAY');
  assert.ok(withOrdinalMode(lines, 'letters').message.every(e => e.type !== 'ordinal'));
});

test('a message without an ordinal is unaffected', () => {
  const lines = { message: messageElements('Graduation', 2026), name: nameElements('Sam') };
  assert.deepEqual(withOrdinalMode(lines, 'number'), lines);
  assert.equal(best(stock({}, 0), 'Graduation', 2026, 'Sam').mode, 'sign');
});

test('the ordinal sign wins when it is free', () => {
  const r = best(stock(), 'Happy Birthday', 29, 'Jordan');
  assert.deepEqual(r, { mode: 'sign', fit: { ok: true } });
});

test('no ordinal sign: plain letters in the name color', () => {
  const r = best(stock({}, 0), 'Happy Birthday', 29, 'Jordan');
  assert.deepEqual(r, { mode: 'letters', fit: { ok: true } });
});

test('letters count against the name color: THEO in red leaves no red T or H, so gold names it', () => {
  // Red has one T and one H, both taken by THEO; gold has plenty
  const snapshot = stock({ 'T-red': 1, 'H-red': 1 }, 0);
  const index = indexStock(snapshot.signs);
  const lines = withOrdinalMode({ message: messageElements('Happy Birthday', 29), name: nameElements('Theo') }, 'letters');
  assert.equal(lineUsage(lines.name, { style: 'classic', colorway: 'red' }, index)!.get('T-red'), 2);
  assert.equal(best(snapshot, 'Happy Birthday', 29, 'Theo').mode, 'letters');
});

test('no ordinal and no spare T or H in any color: the number alone, the last resort', () => {
  // HAPPY BIRTHDAY can only be gold, which it uses up (one T, two H); red has none
  const short = { 'T-gold': 1, 'H-gold': 2, 'T-red': 0, 'H-red': 0 };
  assert.deepEqual(best(stock(short, 0), 'Happy Birthday', 29, 'Jordan'), { mode: 'number', fit: { ok: true } });
});

test('nothing fits at all: the last mode reports which line is short', () => {
  const r = best(stock({ 'J-gold': 0, 'J-red': 0 }, 0), 'Happy Birthday', 29, 'Jordan');
  assert.deepEqual(r, { mode: 'number', fit: { ok: false, reason: 'name' } });
});
