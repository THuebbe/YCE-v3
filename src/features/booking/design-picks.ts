/**
 * The design step's picker rules (PRODUCT.md "Booking configurator"): each
 * line has a style and a color; a line with both is committed and claims
 * its signs; whichever line committed first keeps them when stock runs
 * short. Pure, so the step and the tests agree.
 */
import { buildablePairs, lineUsage, pickerOptions, without, type FreeCounts, type Pair, type StockIndex } from './availability';
import type { LineElement } from './services/line-elements';

export type Line = 'message' | 'name';
export const LINES: Line[] = ['message', 'name'];

export interface Picks {
  message: { style: string; colorway: string };
  name: { style: string; colorway: string };
  /** Committed lines, first committed first */
  order: Line[];
}

export interface DesignInput {
  elements: Record<Line, LineElement[]>;
  free: FreeCounts;
  index: StockIndex;
}

export const other = (line: Line): Line => (line === 'message' ? 'name' : 'message');
export const isCommitted = (picks: Picks, line: Line) => Boolean(picks[line].style && picks[line].colorway);
const pairOf = (picks: Picks, line: Line): Pair => ({ style: picks[line].style, colorway: picks[line].colorway });

/** Signs a committed line takes, or null */
export function usageOf(picks: Picks, line: Line, input: DesignInput) {
  return isCommitted(picks, line) ? lineUsage(input.elements[line], pairOf(picks, line), input.index) : null;
}

/** Pairs a line can use: free stock minus what the other line, if committed, has claimed */
export function pairsFor(picks: Picks, line: Line, input: DesignInput): Pair[] {
  const left = without(input.free, usageOf(picks, other(line), input));
  return buildablePairs(input.elements[line], left, input.index);
}

/** What the line's two pickers show right now */
export function optionsFor(picks: Picks, line: Line, input: DesignInput) {
  return pickerOptions(pairsFor(picks, line, input), picks[line]);
}

/**
 * Picking (or un-picking, with '') a style or color. A line that becomes
 * committed goes to the back of the queue; one that stops being committed
 * leaves it.
 */
export function pick(picks: Picks, line: Line, field: 'style' | 'colorway', value: string): Picks {
  const next: Picks = { ...picks, [line]: { ...picks[line], [field]: value }, order: picks.order.filter(l => l !== line) };
  if (isCommitted(next, line)) next.order = [...next.order, line];
  return next;
}

/**
 * Rechecks every pick against the stock (after the snapshot refreshes or the
 * words change). Committed lines are checked in the order they committed,
 * each against what the lines before it left; one that no longer fits loses
 * its picks, and only it. Half-picked lines drop a pick that's no longer
 * offered.
 */
export function reconcile(picks: Picks, input: DesignInput): { picks: Picks; cleared: Line[] } {
  let next: Picks = { message: { ...picks.message }, name: { ...picks.name }, order: [] };
  const cleared: Line[] = [];
  let left = input.free;

  for (const line of picks.order) {
    if (!isCommitted(picks, line)) continue;
    const usage = lineUsage(input.elements[line], pairOf(picks, line), input.index);
    const ok = usage !== null && buildablePairs(input.elements[line], left, input.index)
      .some(p => p.style === picks[line].style && p.colorway === picks[line].colorway);
    if (ok) {
      next.order.push(line);
      left = without(left, usage);
    } else {
      next = { ...next, [line]: { style: '', colorway: '' } };
      cleared.push(line);
    }
  }

  for (const line of LINES) {
    if (next.order.includes(line)) continue;
    const { styles, colorways } = optionsFor(next, line, input);
    const p = next[line];
    // Each pick is checked against the other's options, so a pair that
    // only works together is kept
    const styleOk = !p.style || styles.includes(p.style);
    const colorOk = !p.colorway || colorways.includes(p.colorway);
    if (!styleOk || !colorOk) {
      next = { ...next, [line]: { style: styleOk ? p.style : '', colorway: colorOk ? p.colorway : '' } };
    }
    // Both picks could be set without being in the order (restored data)
    if (isCommitted(next, line) && styleOk && colorOk) next.order.push(line);
  }
  return { picks: next, cleared };
}
