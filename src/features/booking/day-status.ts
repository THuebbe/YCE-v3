/**
 * What the step 1 calendar shows for each day: bookable, closed by the
 * agency's booking rules, or full (not enough signs free to build this
 * display). Pure, so the calendar and the tests agree.
 */
import { displayFits, freeCounts, type StockIndex, type StockSnapshot } from './availability';
import { addDays, rentalWindow, validateBookingDates, type BookingRules } from './booking-rules';
import type { LineElement } from './services/line-elements';

export type DayStatus =
  | { kind: 'open' }
  /** Booking rules: too soon, a day off, rental length */
  | { kind: 'closed'; reason: string }
  /** Not enough signs free for this display */
  | { kind: 'full'; line: 'message' | 'name' | 'together' }
  /** Availability isn't loaded yet, or the day is past what it covers */
  | { kind: 'unknown' };

export interface DayCheck {
  rules: BookingRules;
  today: string;
  extraDaysBefore: number;
  extraDaysAfter: number;
  snapshot: StockSnapshot | null;
  index: StockIndex | null;
  /** Last day the snapshot covers */
  coveredTo: string;
  message: LineElement[];
  name: LineElement[];
}

/** The wizard stores event dates at local noon */
export const dateOf = (day: string) => new Date(`${day}T12:00:00`);

export function dayStatus(day: string, check: DayCheck): DayStatus {
  const closed = validateBookingDates(check.rules, dateOf(day), check.extraDaysBefore, check.extraDaysAfter, check.today);
  if (closed) return { kind: 'closed', reason: closed };
  if (!check.snapshot || !check.index) return { kind: 'unknown' };
  const { start, end } = rentalWindow(check.rules, dateOf(day), check.extraDaysBefore, check.extraDaysAfter);
  if (end > check.coveredTo) return { kind: 'unknown' };
  const fit = displayFits(check.message, check.name, freeCounts(check.snapshot, start, end), check.index);
  return fit.ok ? { kind: 'open' } : { kind: 'full', line: fit.reason };
}

/** Up to `limit` open days near `day`, closest first (earlier wins a tie) */
export function nearbyOpenDays(day: string, check: DayCheck, limit = 3, reach = 10): string[] {
  const found: string[] = [];
  for (let d = 1; d <= reach && found.length < limit; d++) {
    for (const candidate of [addDays(day, -d), addDays(day, d)]) {
      if (found.length < limit && dayStatus(candidate, check).kind === 'open') found.push(candidate);
    }
  }
  return found;
}
