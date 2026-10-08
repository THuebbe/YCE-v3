'use server';

/**
 * Public booking-wizard server actions: the only way the customer side
 * touches inventory. Unauthenticated by design (customers don't sign in), so
 * every action resolves the agency from its slug server-side and every hold
 * is bound to the wizard's session id. RLS is off - all queries below filter
 * on the agency.
 */
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { supabase, getAgencyBySlug } from '@/lib/db/supabase-client';
import { parseBookingRules, rentalWindow, resolveTimeZone, todayIn, validateBookingDates } from './booking-rules';

const MAX_SIGNS_PER_HOLD = 200;

interface Shortage {
  name: string;
  requested: number;
  available: number;
}

export type CreateHoldResult =
  | { ok: true; holdId: string; rentalStart: string; rentalEnd: string }
  | { ok: false; error: string; shortages?: Shortage[] };

async function resolveAgency(agencySlug: string) {
  const agency = await getAgencyBySlug(agencySlug);
  return agency?.is_active
    ? (agency as { id: string; booking_rules: unknown; operating_hours: unknown })
    : null;
}

/**
 * Rate-limit key for the caller: a hash of the client IP (Vercel sets
 * x-forwarded-for / x-real-ip itself, so they can't be spoofed there).
 * Null when there's no IP (local dev) - the limit is then skipped.
 */
async function clientKey(): Promise<string | null> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim();
  return ip ? createHash('sha256').update(`yce-hold:${ip}`).digest('hex').slice(0, 32) : null;
}

/** Styles and colorways this agency actually stocks, for the wizard pickers. */
export async function getBookingCatalog(agencySlug: string): Promise<{ styles: string[]; colorways: string[] }> {
  const agency = await resolveAgency(agencySlug);
  if (!agency) return { styles: [], colorways: [] };

  const { data, error } = await supabase.rpc('yce_owned_styles', { p_agency_id: agency.id });
  if (error || !data) {
    console.error('getBookingCatalog failed:', error?.message);
    return { styles: [], colorways: [] };
  }
  const rows = data as { style: string; colorway: string }[];
  return {
    styles: [...new Set(rows.map(r => r.style))],
    colorways: [...new Set(rows.map(r => r.colorway))],
  };
}

/**
 * Takes (or replaces) this session's temporary hold on the signs a layout
 * preview placed. `catalogKeys` holds one entry per physical sign, so a
 * repeated letter appears once per use.
 */
export async function createBookingHold(input: {
  agencySlug: string;
  sessionId: string;
  /** Customer's IANA zone; used for the order cutoff when the agency has none */
  timeZone?: string;
  eventDate: string;
  extraDaysBefore: number;
  extraDaysAfter: number;
  catalogKeys: string[];
  replaceHoldId?: string;
}): Promise<CreateHoldResult> {
  const agency = await resolveAgency(input.agencySlug);
  if (!agency) return { ok: false, error: 'This agency is not taking bookings' };
  if (!input.sessionId) return { ok: false, error: 'Missing booking session' };
  if (input.catalogKeys.length === 0 || input.catalogKeys.length > MAX_SIGNS_PER_HOLD) {
    return { ok: false, error: 'This display has no signs to reserve' };
  }

  const eventDate = new Date(input.eventDate);
  const before = Math.max(0, Math.floor(input.extraDaysBefore || 0));
  const after = Math.max(0, Math.floor(input.extraDaysAfter || 0));
  const rules = parseBookingRules(agency.booking_rules);
  const today = todayIn(resolveTimeZone(agency.operating_hours, input.timeZone));
  const dateError = validateBookingDates(rules, eventDate, before, after, today);
  if (dateError) return { ok: false, error: dateError };

  const counts = new Map<string, number>();
  for (const key of input.catalogKeys) counts.set(key, (counts.get(key) ?? 0) + 1);

  const { data: signs, error: signError } = await supabase
    .from('sign_library')
    .select('id, asset_key, name')
    .in('asset_key', [...counts.keys()]);
  if (signError || !signs) {
    console.error('createBookingHold sign lookup failed:', signError?.message);
    return { ok: false, error: 'Could not check inventory. Please try again.' };
  }
  const byKey = new Map(signs.map(s => [s.asset_key as string, s]));
  const unknown = [...counts.keys()].filter(k => !byKey.has(k));
  if (unknown.length > 0) {
    console.warn('createBookingHold: no sign_library row for', unknown);
    return { ok: false, error: 'Some signs in this display are not carried by this agency' };
  }

  const { start, end } = rentalWindow(rules, eventDate, before, after);
  const { data, error } = await supabase.rpc('yce_create_booking_hold', {
    p_agency_id: agency.id,
    p_session_id: input.sessionId,
    p_rental_start: start,
    p_rental_end: end,
    p_items: [...counts].map(([key, quantity]) => ({ sign_id: byKey.get(key)!.id, quantity })),
    p_replace_hold_id: input.replaceHoldId ?? null,
    p_client_key: await clientKey(),
  });
  if (error || !data) {
    console.error('yce_create_booking_hold failed:', error?.message);
    return { ok: false, error: 'Could not reserve signs. Please try again.' };
  }

  const result = data as { ok: boolean; hold_id?: string; reason?: string; shortages?: { sign_id: string; requested: number; available: number }[] };
  if (result.ok && result.hold_id) {
    return { ok: true, holdId: result.hold_id, rentalStart: start, rentalEnd: end };
  }
  if (result.reason === 'rate_limited') {
    return { ok: false, error: 'Too many reservation attempts. Please wait a few minutes and try again.' };
  }
  if (result.reason === 'insufficient_stock') {
    const nameById = new Map(signs.map(s => [s.id as string, s.name as string]));
    return {
      ok: false,
      error: 'Not enough of some signs are free for these dates. Try another color, or go back and change your dates.',
      shortages: (result.shortages ?? []).map(s => ({
        name: nameById.get(s.sign_id) ?? s.sign_id,
        requested: s.requested,
        available: s.available,
      })),
    };
  }
  return { ok: false, error: 'Could not reserve signs. Please try again.' };
}

/**
 * Customer activity: slide the hold's 1-hour expiry forward. Returns false
 * when the hold already lapsed; order creation re-checks stock in that case.
 */
export async function touchBookingHold(input: {
  agencySlug: string;
  sessionId: string;
  holdId: string;
}): Promise<{ ok: boolean }> {
  const agency = await resolveAgency(input.agencySlug);
  if (!agency || !input.holdId || !input.sessionId) return { ok: false };
  const { data, error } = await supabase.rpc('yce_touch_booking_hold', {
    p_hold_id: input.holdId,
    p_agency_id: agency.id,
    p_session_id: input.sessionId,
  });
  if (error) console.error('yce_touch_booking_hold failed:', error.message);
  return { ok: Boolean((data as { ok?: boolean } | null)?.ok) };
}
