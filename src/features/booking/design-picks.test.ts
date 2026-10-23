// The design step's pickers. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freeCounts, indexStock, type StockSnapshot } from './availability';
import { optionsFor, pick, reconcile, type DesignInput, type Picks } from './design-picks';
import { messageElements, nameElements } from './services/line-elements';

function input(over: Record<string, number> = {}, message = 'Congratulations', name = 'Jenny'): DesignInput {
  const signs: StockSnapshot['signs'] = [];
  for (const style of ['classic', 'fun']) {
    for (const colorway of ['gold', 'red']) {
      for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const id = `${character}-${style}-${colorway}`;
        signs.push({ id, key: id, type: 'letter', character, style, colorway, quantity: over[id] ?? 4 });
      }
    }
  }
  const snapshot = { signs, holds: [] };
  return {
    elements: { message: messageElements(message), name: nameElements(name) },
    free: freeCounts(snapshot, '2026-11-06', '2026-11-08'),
    index: indexStock(signs),
  };
}

const empty: Picks = { message: { style: '', colorway: '' }, name: { style: '', colorway: '' }, order: [] };

test('both picks commit a line; the first committed line claims its signs', () => {
  const inp = input({ 'N-classic-gold': 3 });
  assert.deepEqual(optionsFor(empty, 'name', inp).colorways, ['gold', 'red']);
  let p = pick(empty, 'message', 'colorway', 'gold');
  // Gold message: classic and fun both still offered (both have 2 N's free)
  assert.deepEqual(optionsFor(p, 'message', inp).styles, ['classic', 'fun']);
  // Name not affected yet: the message isn't committed
  assert.deepEqual(optionsFor(p, 'name', inp).styles, ['classic', 'fun']);
  p = pick(p, 'message', 'style', 'classic');
  assert.deepEqual(p.order, ['message']);
  // Classic gold message takes 2 of 3 N's: classic disappears for a gold name
  assert.deepEqual(optionsFor(pick(p, 'name', 'colorway', 'gold'), 'name', inp).styles, ['fun']);
});

test('changing a committed line\'s pick releases its signs and re-queues it', () => {
  let p = pick(pick(empty, 'message', 'style', 'classic'), 'message', 'colorway', 'gold');
  p = pick(pick(p, 'name', 'style', 'fun'), 'name', 'colorway', 'red');
  assert.deepEqual(p.order, ['message', 'name']);
  p = pick(p, 'message', 'colorway', 'red');
  assert.deepEqual(p.order, ['name', 'message']);
  p = pick(p, 'message', 'colorway', '');
  assert.deepEqual(p.order, ['name']);
});

test('reconcile: a committed line that no longer fits loses its picks, only it', () => {
  let p = pick(pick(empty, 'name', 'style', 'classic'), 'name', 'colorway', 'gold'); // name first
  p = pick(pick(p, 'message', 'style', 'fun'), 'message', 'colorway', 'red');
  // Stock moves: fun red runs out of N's; the name is untouched
  const { picks, cleared } = reconcile(p, input({ 'N-fun-red': 1 }));
  assert.deepEqual(cleared, ['message']);
  assert.deepEqual(picks.message, { style: '', colorway: '' });
  assert.deepEqual(picks.name, { style: 'classic', colorway: 'gold' });
  assert.deepEqual(picks.order, ['name']);
});

test('reconcile: the line that committed first keeps the contested signs', () => {
  // 3 classic gold N's: name (2) committed first, then the message also in classic gold (2) -> message loses
  let p = pick(pick(empty, 'name', 'style', 'classic'), 'name', 'colorway', 'gold');
  p = { ...p, message: { style: 'classic', colorway: 'gold' }, order: ['name', 'message'] };
  const { picks, cleared } = reconcile(p, input({ 'N-classic-gold': 3 }));
  assert.deepEqual(cleared, ['message']);
  assert.deepEqual(picks.order, ['name']);
});

test('reconcile: a half-picked line drops a pick that\'s no longer offered', () => {
  const p = pick(empty, 'name', 'colorway', 'red');
  const noRedJ = { 'J-classic-red': 0, 'J-fun-red': 0 };
  const { picks, cleared } = reconcile(p, input(noRedJ));
  assert.deepEqual(cleared, []);
  assert.deepEqual(picks.name, { style: '', colorway: '' });
});

test('reconcile: still-valid picks stay put', () => {
  let p = pick(pick(empty, 'message', 'style', 'classic'), 'message', 'colorway', 'gold');
  p = pick(p, 'name', 'colorway', 'red');
  const r = reconcile(p, input());
  assert.deepEqual(r.picks, p);
  assert.deepEqual(r.cleared, []);
});
