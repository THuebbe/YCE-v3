/**
 * What the configurator may offer: which style and color pairs can build a
 * line of signs on the customer's dates, from one snapshot of the agency's
 * stock and holds (PRODUCT.md "Booking configurator").
 *
 * The snapshot loads once (getAvailabilitySnapshot); everything here is
 * worked out in the browser from it, so every pick recalculates instantly.
 * The reservation stays the final check: it runs the same rule in the
 * database (yce_sign_availability) under a lock.
 *
 * Kept free of server and React imports: client, server and tests use it.
 */
import type { LineElement } from './services/line-elements';

export interface StockSign {
  id: string;
  /** sign_library.asset_key: what the layout calculator reserves */
  key: string;
  type: string;
  /** "A", "7", "&", "ST" (ordinals); null for decorations and the like */
  character: string | null;
  /** Lowercase ("classic", "gold"); null for unstyled signs (ordinals, decorations) */
  style: string | null;
  colorway: string | null;
  quantity: number;
}

export interface StockHold {
  kind: 'temporary' | 'order';
  /** YYYY-MM-DD, delivery to pickup */
  start: string;
  end: string;
  /** This booking session's own hold: doesn't block itself */
  mine: boolean;
  items: { signId: string; quantity: number }[];
}

export interface StockSnapshot {
  signs: StockSign[];
  holds: StockHold[];
}

/** Characters that exist as sign art (letters, numbers, punctuation). */
export const SIGN_CHARACTERS = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  '!', '&', "'", ',', '-', '.', '?',
]);

/** Characters in `text` that no sign exists for (accented letters, emoji...). Spaces are fine. */
export function unsupportedCharacters(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text.toUpperCase()) {
    if (/\s/.test(ch)) continue;
    if (!SIGN_CHARACTERS.has(ch)) bad.add(ch);
  }
  return [...bad];
}

export type FreeCounts = Map<string, number>;

/**
 * Units of each sign free for every day of [start, end], the same rule as
 * yce_sign_availability: live temporary holds block the days they overlap;
 * order holds block from their delivery day until released (check-in).
 */
export function freeCounts(snapshot: StockSnapshot, start: string, end: string): FreeCounts {
  const free: FreeCounts = new Map(snapshot.signs.map(s => [s.id, s.quantity]));
  for (const hold of snapshot.holds) {
    if (hold.mine) continue;
    const blocks = hold.kind === 'order'
      ? hold.start <= end
      : hold.start <= end && hold.end >= start;
    if (!blocks) continue;
    for (const item of hold.items) {
      if (free.has(item.signId)) free.set(item.signId, Math.max(0, free.get(item.signId)! - item.quantity));
    }
  }
  return free;
}

export interface StockIndex {
  /** "A|classic|gold" -> sign id (letters, numbers, punctuation) */
  styled: Map<string, string>;
  /** "ST" -> sign id */
  ordinals: Map<string, string>;
  /** Every style and color pair the agency stocks anything in */
  pairs: Pair[];
}

export interface Pair { style: string; colorway: string }

const styledKey = (character: string, style: string, colorway: string) => `${character}|${style}|${colorway}`;

export function indexStock(signs: StockSign[]): StockIndex {
  const styled = new Map<string, string>();
  const ordinals = new Map<string, string>();
  const pairs = new Map<string, Pair>();
  for (const s of signs) {
    if (s.type === 'ordinal' && s.character) {
      ordinals.set(s.character.toUpperCase(), s.id);
    } else if (s.character && s.style && s.colorway) {
      styled.set(styledKey(s.character.toUpperCase(), s.style, s.colorway), s.id);
      pairs.set(`${s.style}|${s.colorway}`, { style: s.style, colorway: s.colorway });
    }
  }
  return { styled, ordinals, pairs: [...pairs.values()] };
}

/** Signs a line takes in one style and color (sign id -> count), or null when one isn't stocked at all. */
export function lineUsage(elements: LineElement[], pair: Pair, index: StockIndex): Map<string, number> | null {
  const usage = new Map<string, number>();
  for (const el of elements) {
    const id = el.type === 'ordinal'
      ? index.ordinals.get(el.value)
      : index.styled.get(styledKey(el.value, pair.style, pair.colorway));
    if (!id) return null;
    usage.set(id, (usage.get(id) ?? 0) + 1);
  }
  return usage;
}

export function fits(usage: Map<string, number>, free: FreeCounts): boolean {
  for (const [id, count] of usage) if ((free.get(id) ?? 0) < count) return false;
  return true;
}

/** `free` minus what a committed line takes (the shared-stock rule). */
export function without(free: FreeCounts, usage: Map<string, number> | null): FreeCounts {
  if (!usage) return free;
  const left = new Map(free);
  for (const [id, count] of usage) left.set(id, Math.max(0, (left.get(id) ?? 0) - count));
  return left;
}

/** Style and color pairs that can build the line from `free`. Empty line: none. */
export function buildablePairs(elements: LineElement[], free: FreeCounts, index: StockIndex): Pair[] {
  if (elements.length === 0) return [];
  return index.pairs.filter(pair => {
    const usage = lineUsage(elements, pair, index);
    return usage !== null && fits(usage, free);
  });
}

/**
 * What each picker shows, given the other picker's choice: picking a color
 * hides the styles that can't build the line in it, and the other way
 * round. With nothing picked, a style shows while any color works with it.
 */
export function pickerOptions(pairs: Pair[], picked: { style?: string; colorway?: string }) {
  const uniq = (values: string[]) => [...new Set(values)].sort();
  return {
    styles: uniq(pairs.filter(p => !picked.colorway || p.colorway === picked.colorway).map(p => p.style)),
    colorways: uniq(pairs.filter(p => !picked.style || p.style === picked.style).map(p => p.colorway)),
  };
}

export type FitResult =
  | { ok: true }
  | { ok: false; reason: 'message' | 'name' | 'together' };

/**
 * Whether the message and name can both be built from `free`: some pair
 * for the message, and some pair for the name from what the message
 * leaves. Says which line is the problem when not.
 */
export function displayFits(message: LineElement[], name: LineElement[], free: FreeCounts, index: StockIndex): FitResult {
  const messagePairs = buildablePairs(message, free, index);
  if (message.length > 0 && messagePairs.length === 0) return { ok: false, reason: 'message' };
  const namePairs = buildablePairs(name, free, index);
  if (name.length > 0 && namePairs.length === 0) return { ok: false, reason: 'name' };
  if (message.length === 0 || name.length === 0) return { ok: true };
  for (const pair of messagePairs) {
    const left = without(free, lineUsage(message, pair, index));
    if (buildablePairs(name, left, index).length > 0) return { ok: true };
  }
  return { ok: false, reason: 'together' };
}
