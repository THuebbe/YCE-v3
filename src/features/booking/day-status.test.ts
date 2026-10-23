// The step 1 calendar's day states. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayStatus, nearbyOpenDays, type DayCheck } from './day-status';
import { indexStock, type StockSnapshot } from './availability';
import { DEFAULT_BOOKING_RULES } from './booking-rules';
import { messageElements, nameElements } from './services/line-elements';

function snapshot(): StockSnapshot {
  const signs: StockSnapshot['signs'] = [];
  for (const colorway of ['gold', 'red']) {
    for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      signs.push({ id: `${character}-${colorway}`, key: `${character}-${colorway}`, type: 'letter', character, style: 'classic', colorway, quantity: 2 });
    }
  }
  return { signs, holds: [] };
}

function check(snap: StockSnapshot, over: Partial<DayCheck> = {}): DayCheck {
  return {
    rules: DEFAULT_BOOKING_RULES, // order 1 day ahead, 1 setup day, 1 teardown day
    today: '2026-11-01',
    extraDaysBefore: 0,
    extraDaysAfter: 0,
    snapshot: snap,
    index: indexStock(snap.signs),
    coveredTo: '2027-04-30',
    message: messageElements('Congratulations'),
    name: nameElements('Jenny'),
    ...over,
  };
}

test('too soon is closed by the booking rules, with their reason', () => {
  const s = dayStatus('2026-11-02', check(snapshot()));
  assert.equal(s.kind, 'closed');
  assert.match((s as { reason: string }).reason, /earliest available event date/);
});

test('a day with enough signs is open', () => {
  assert.deepEqual(dayStatus('2026-11-14', check(snapshot())), { kind: 'open' });
});

test('a day someone else holds the N\'s for is full, and says which line', () => {
  const snap = snapshot();
  // Nov 13-15 (Saturday Nov 14 +- setup/teardown): every N is held
  snap.holds = [{ kind: 'temporary', start: '2026-11-13', end: '2026-11-15', mine: false, items: [{ signId: 'N-gold', quantity: 2 }, { signId: 'N-red', quantity: 1 }] }];
  // Each pair keeps at most 1 N: CONGRATULATIONS needs 2
  assert.deepEqual(dayStatus('2026-11-14', check(snap)), { kind: 'full', line: 'message' });
  // The next weekend is free again
  assert.deepEqual(dayStatus('2026-11-21', check(snap)), { kind: 'open' });
});

test('extra days widen the window: a day can fill up when days are added', () => {
  const snap = snapshot();
  snap.holds = [{ kind: 'temporary', start: '2026-11-17', end: '2026-11-18', mine: false, items: [{ signId: 'J-gold', quantity: 2 }, { signId: 'J-red', quantity: 2 }] }];
  assert.deepEqual(dayStatus('2026-11-14', check(snap)), { kind: 'open' });
  // Two extra days after: pickup moves to Nov 17, into the hold
  assert.deepEqual(dayStatus('2026-11-14', check(snap, { extraDaysAfter: 2 })), { kind: 'full', line: 'name' });
});

test('unknown until availability loads, and past the range it covers', () => {
  assert.deepEqual(dayStatus('2026-11-14', check(snapshot(), { snapshot: null, index: null })), { kind: 'unknown' });
  assert.deepEqual(dayStatus('2026-11-14', check(snapshot(), { coveredTo: '2026-11-10' })), { kind: 'unknown' });
});

test('nearby open days: closest first, skipping full and closed ones', () => {
  const snap = snapshot();
  snap.holds = [{ kind: 'temporary', start: '2026-11-12', end: '2026-11-16', mine: false, items: [{ signId: 'N-gold', quantity: 2 }, { signId: 'N-red', quantity: 2 }] }];
  // Signs are out the day before and after (setup, teardown), so Nov 11-17
  // all touch the hold; the 10th and 18th are the closest open days
  assert.deepEqual(nearbyOpenDays('2026-11-14', check(snap)), ['2026-11-10', '2026-11-18', '2026-11-09']);
});
