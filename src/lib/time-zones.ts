/**
 * Time zones an agency can pick (stored in agencies.operating_hours.timeZone).
 * The order cutoff's "end of day" is decided in this zone (booking-rules.ts).
 */
export const AGENCY_TIME_ZONES: { value: string; label: string }[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST, no daylight saving)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

export const isAgencyTimeZone = (tz: unknown): tz is string =>
  typeof tz === 'string' && AGENCY_TIME_ZONES.some(z => z.value === tz);

/** The browser's zone when it's one we offer, else '' (make them choose). */
export function guessAgencyTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isAgencyTimeZone(tz) ? tz : '';
  } catch {
    return '';
  }
}
