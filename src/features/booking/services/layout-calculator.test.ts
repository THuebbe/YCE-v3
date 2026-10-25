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

// Which decorations a layout placed, by name ("decoration-Ballet Slippers-3")
const decorationNames = (layout: { zone3: { signs: { signId: string; side?: string; position: number }[] } }) =>
  layout.zone3.signs.map(s => s.signId.split('-').slice(1, -1).join('-'));

test('the Holiday theme means the holiday nearest the event', async () => {
  const october = await new LayoutCalculatorService().calculateLayout({ ...base, theme: 'Holiday', eventDate: '2026-10-31' });
  for (const name of decorationNames(october)) assert.ok(['Pumpkin', 'Ghost', 'Stars'].includes(name), name);
  const december = await new LayoutCalculatorService().calculateLayout({ ...base, theme: 'Holiday', eventDate: '2026-12-20' });
  for (const name of decorationNames(december)) assert.ok(['Christmas Tree', 'Snowflake', 'Gift', 'Stars'].includes(name), name);
});

test('without a theme, the message picks the occasion', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, theme: undefined, message: 'Congrats Grad' });
  for (const name of decorationNames(layout)) assert.ok(['Graduation Cap', 'Diploma', 'Stars', 'Trophy', 'Balloon'].includes(name), name);
});

test('a hobby puts its own decorations first', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, hobbies: ['Dance'] });
  const left = layout.zone3.signs.filter(s => s.side === 'left').sort((a, b) => a.position - b.position);
  assert.equal(left[0].signId.split('-')[1], 'Ballet Slippers');
});

test('a hobby repeats its own decorations before reaching for unrelated ones', async () => {
  const layout = await new LayoutCalculatorService().calculateLayout({ ...base, message: 'Congratulations', recipientName: 'Ava', hobbies: ['Dance'] });
  for (const name of decorationNames(layout)) assert.ok(['Ballet Slippers', 'Tutu', 'Disco Ball'].includes(name), name);
});
