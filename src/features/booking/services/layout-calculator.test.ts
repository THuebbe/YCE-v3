// Random extras only come from free stock. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LayoutCalculatorService } from './layout-calculator';
import { MOCK_BACKDROPS, MOCK_DECORATIONS, backdropKey, bookendKey, decorationKey } from './catalog-keys';

const base = { message: 'Happy Birthday', recipientName: 'Jo', agencyId: 'a', theme: 'classic' };

function stock(over: Record<string, number> = {}) {
  const m = new Map<string, number>();
  for (const d of MOCK_DECORATIONS) m.set(decorationKey(d), 10);
  for (const b of MOCK_BACKDROPS) m.set(backdropKey(b), 10);
  m.set(bookendKey('Left Bookend'), 1);
  m.set(bookendKey('Right Bookend'), 1);
  for (const [k, v] of Object.entries(over)) m.set(k, v);
  return m;
}

test('extras never use more units than are free', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, extrasStock: stock({ [decorationKey('Gift')]: 1, [decorationKey('Bow')]: 0 }) });
  const keys = [...layout.zone3.signs, ...layout.zone4.signs, ...layout.zone5.signs].map(s => s.catalogKey);
  assert.ok(!keys.includes(decorationKey('Bow')));
  assert.ok(keys.filter(k => k === decorationKey('Gift')).length <= 1);
});

test('a bookend that isn\'t free is left out, not double-booked', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, extrasStock: stock({ [bookendKey('Right Bookend')]: 0 }) });
  assert.deepEqual(layout.zone5.signs.map(s => s.catalogKey), [bookendKey('Left Bookend')]);
});

test('no extras free at all: the letters still lay out', async () => {
  const empty = new Map<string, number>();
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, extrasStock: empty });
  assert.equal(layout.zone3.signs.length + layout.zone4.signs.length + layout.zone5.signs.length, 0);
  assert.equal(layout.zone2.signs.length, 2);
});

test('the name can use its own style', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, style: 'classic', nameStyle: 'fun' });
  assert.equal(layout.zone2.signs.length, 2);
});
