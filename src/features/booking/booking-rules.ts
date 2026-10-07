/**
 * Booking rules come from `agencies.booking_rules` (JSONB), the values the
 * agency settings UI and /api/agency/booking-rules write. The wizard and the
 * server both enforce them through this file - never hardcode a lead time.
 *
 * Shared by client and server: keep it free of server-only imports.
 */
export interface BookingRules {
  minimumLeadTimeHours: number;
  minimumRentalDays: number;
  maximumRentalDays: number;
  allowSameDayBooking: boolean;
}

/** Same defaults the agency settings route applies to a missing value. */
export const DEFAULT_BOOKING_RULES: BookingRules = {
  minimumLeadTimeHours: 48,
  minimumRentalDays: 1,
  maximumRentalDays: 14,
  allowSameDayBooking: false,
};

/** The extra-day steppers' own cap, independent of the agency's rules. */
const MAX_EXTRA_DAYS_PER_SIDE = 7;

export function parseBookingRules(raw: unknown): BookingRules {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, fallback: number, min: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min ? n : fallback;
  };
  const minimumRentalDays = Math.floor(num(r.minimumRentalDays, DEFAULT_BOOKING_RULES.minimumRentalDays, 1));
  const maximumRentalDays = Math.max(
    minimumRentalDays,
    Math.floor(num(r.maximumRentalDays, DEFAULT_BOOKING_RULES.maximumRentalDays, 1))
  );
  return {
    minimumLeadTimeHours: num(r.minimumLeadTimeHours, DEFAULT_BOOKING_RULES.minimumLeadTimeHours, 0),
    minimumRentalDays,
    maximumRentalDays,
    allowSameDayBooking: typeof r.allowSameDayBooking === 'boolean'
      ? r.allowSameDayBooking
      : DEFAULT_BOOKING_RULES.allowSameDayBooking,
  };
}

/** Rental length in days: the event day plus any extra days either side. */
export function rentalDays(extraDaysBefore: number, extraDaysAfter: number): number {
  return 1 + extraDaysBefore + extraDaysAfter;
}

/** Most extra days still allowed on one side, given the other side. */
export function maxExtraDays(rules: BookingRules, otherSide: number): number {
  return Math.max(0, Math.min(MAX_EXTRA_DAYS_PER_SIDE, rules.maximumRentalDays - 1 - otherSide));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD of an instant, in UTC. The wizard stores event dates at local
 *  noon, which lands on the same calendar day in UTC for US time zones. */
export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dayKey: string, days: number): string {
  return toDayKey(new Date(Date.parse(`${dayKey}T12:00:00Z`) + days * DAY_MS));
}

/**
 * The calendar days the signs are out: from delivery (extra days before the
 * event) through removal, the day after the last rental day. Holds block
 * exactly this range.
 */
export function rentalWindow(eventDate: Date, extraDaysBefore: number, extraDaysAfter: number) {
  const eventDay = toDayKey(eventDate);
  return {
    start: addDays(eventDay, -extraDaysBefore),
    end: addDays(eventDay, 1 + extraDaysAfter),
  };
}

/** Earliest event date allowed with no extra days before it. */
export function earliestEventDate(rules: BookingRules, now = new Date()): Date {
  return new Date(now.getTime() + rules.minimumLeadTimeHours * 60 * 60 * 1000);
}

/**
 * Returns a customer-facing error, or null when the dates are bookable.
 * Lead time is measured to delivery (the first extra day before the event),
 * since that's when the agency has to show up. Lead time wins over the
 * same-day toggle; the toggle only matters for lead times under a day.
 */
export function validateBookingDates(
  rules: BookingRules,
  eventDate: Date,
  extraDaysBefore: number,
  extraDaysAfter: number,
  now = new Date()
): string | null {
  if (isNaN(eventDate.getTime())) return 'Please choose a valid event date';

  const delivery = new Date(eventDate.getTime() - extraDaysBefore * DAY_MS);
  if (delivery.getTime() < now.getTime() + rules.minimumLeadTimeHours * 60 * 60 * 1000) {
    return extraDaysBefore > 0
      ? `Delivery (${extraDaysBefore} day${extraDaysBefore === 1 ? '' : 's'} before the event) must be at least ${rules.minimumLeadTimeHours} hours from now`
      : `Event date must be at least ${rules.minimumLeadTimeHours} hours from now`;
  }
  if (!rules.allowSameDayBooking && toDayKey(delivery) <= toDayKey(now)) {
    return 'Same-day delivery is not available';
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
