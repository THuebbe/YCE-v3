/**
 * Booking rules come from `agencies.booking_rules` (JSONB), written by the
 * agency settings UI via /api/agency/booking-rules. The wizard and the
 * server both enforce them through this file - never hardcode a date rule.
 *
 * Model (decided 2026-10-07):
 *   delivery  = event day - extra days before - setupDays
 *   signs out = delivery .. event day + extra days after + teardownDays
 *   cutoff    = the customer must order by end of day, orderCutoffDays
 *               before delivery (0 = ordering on delivery day is fine)
 * Setup/teardown days are free and only block inventory; extra days are
 * the customer's paid display days. All days are calendar days.
 *
 * Shared by client and server: keep it free of server-only imports.
 */
export interface BookingRules {
  orderCutoffDays: number;
  setupDays: number;
  teardownDays: number;
  minimumRentalDays: number;
  maximumRentalDays: number;
  /** YYYY-MM-DD days the agency doesn't work (agencies.blackout_dates):
   *  no delivery or pickup on them. Absent = none. */
  blackoutDays?: string[];
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  orderCutoffDays: 1,
  setupDays: 1,
  teardownDays: 1,
  minimumRentalDays: 1,
  maximumRentalDays: 14,
};

/** The extra-day steppers' own cap, independent of the agency's rules. */
const MAX_EXTRA_DAYS_PER_SIDE = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** `blackoutRaw` is agencies.blackout_dates ([{ date: 'YYYY-MM-DD', ... }]). */
export function parseBookingRules(raw: unknown, blackoutRaw?: unknown): BookingRules {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const int = (v: unknown, fallback: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
  };
  const d = DEFAULT_BOOKING_RULES;
  const minimumRentalDays = int(r.minimumRentalDays, d.minimumRentalDays, 1, 30);
  return {
    orderCutoffDays: int(r.orderCutoffDays, d.orderCutoffDays, 0, 30),
    setupDays: int(r.setupDays, d.setupDays, 0, 14),
    teardownDays: int(r.teardownDays, d.teardownDays, 0, 14),
    minimumRentalDays,
    maximumRentalDays: Math.max(minimumRentalDays, int(r.maximumRentalDays, d.maximumRentalDays, 1, 30)),
    ...(blackoutRaw !== undefined ? { blackoutDays: parseBlackoutDays(blackoutRaw) } : {}),
  };
}

function parseBlackoutDays(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(entry => (entry && typeof entry === 'object' ? (entry as Record<string, unknown>).date : entry))
    .filter((day): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day));
}

/** Display days the customer pays for: the event day plus extra days. */
export function rentalDays(extraDaysBefore: number, extraDaysAfter: number): number {
  return 1 + extraDaysBefore + extraDaysAfter;
}

/** Most extra days still allowed on one side, given the other side. */
export function maxExtraDays(rules: BookingRules, otherSide: number): number {
  return Math.max(0, Math.min(MAX_EXTRA_DAYS_PER_SIDE, rules.maximumRentalDays - 1 - otherSide));
}

/** YYYY-MM-DD of an instant, in UTC. The wizard stores event dates at local
 *  noon, which lands on the same calendar day in UTC for the Americas and
 *  Europe. */
export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dayKey: string, days: number): string {
  return toDayKey(new Date(Date.parse(`${dayKey}T12:00:00Z`) + days * DAY_MS));
}

/** Today's date in `timeZone` (an IANA name). Unknown or missing -> UTC. */
export function todayIn(timeZone: string | undefined, now = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC' }).format(now);
  } catch {
    return toDayKey(now);
  }
}

/** The agency's time zone if it set one (operating_hours.timeZone), else
 *  the customer's - "end of day" is local to whoever is in charge of it. */
export function resolveTimeZone(operatingHours: unknown, customerTimeZone?: string): string | undefined {
  const tz = operatingHours && typeof operatingHours === 'object'
    ? (operatingHours as Record<string, unknown>).timeZone
    : undefined;
  return typeof tz === 'string' && tz ? tz : customerTimeZone;
}

/** Calendar days the signs are out (and held): delivery through pickup. */
export function rentalWindow(
  rules: BookingRules,
  eventDate: Date,
  extraDaysBefore: number,
  extraDaysAfter: number
) {
  const eventDay = toDayKey(eventDate);
  return {
    start: addDays(eventDay, -(extraDaysBefore + rules.setupDays)),
    end: addDays(eventDay, extraDaysAfter + rules.teardownDays),
  };
}

/** Earliest event day bookable today with this many extra days before. */
export function earliestEventDay(rules: BookingRules, extraDaysBefore: number, today: string): string {
  return addDays(today, rules.orderCutoffDays + rules.setupDays + extraDaysBefore);
}

/** Human label for a YYYY-MM-DD day key, e.g. "Saturday, Oct 10". */
export function formatDay(dayKey: string, withYear = false): string {
  return new Date(`${dayKey}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: withYear ? 'long' : 'short', day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  });
}

/**
 * Returns a customer-facing error, or null when the dates are bookable.
 * `today` is a YYYY-MM-DD in the deciding time zone (see todayIn).
 */
export function validateBookingDates(
  rules: BookingRules,
  eventDate: Date,
  extraDaysBefore: number,
  extraDaysAfter: number,
  today: string
): string | null {
  if (isNaN(eventDate.getTime())) return 'Please choose a valid event date';

  const earliest = earliestEventDay(rules, extraDaysBefore, today);
  if (toDayKey(eventDate) < earliest) {
    return extraDaysBefore > 0
      ? `With ${extraDaysBefore} extra day${extraDaysBefore === 1 ? '' : 's'} before, the earliest event date is ${formatDay(earliest)}`
      : `The earliest available event date is ${formatDay(earliest)}`;
  }

  // The agency has to be working on the days it delivers and picks up
  const blackout = rules.blackoutDays ?? [];
  if (blackout.length) {
    const { start, end } = rentalWindow(rules, eventDate, extraDaysBefore, extraDaysAfter);
    if (blackout.includes(start)) {
      return `We can't deliver on ${formatDay(start)} (closed) - please pick another date`;
    }
    if (blackout.includes(end)) {
      return `We can't pick up on ${formatDay(end)} (closed) - please pick another date or change the extra days`;
    }
  }

  const days = rentalDays(extraDaysBefore, extraDaysAfter);
  if (days < rules.minimumRentalDays) {
    return `Minimum rental is ${rules.minimumRentalDays} days - add extra days before or after the event`;
  }
  if (days > rules.maximumRentalDays) {
    return `Maximum rental is ${rules.maximumRentalDays} days`;
  }
  return null;
}
