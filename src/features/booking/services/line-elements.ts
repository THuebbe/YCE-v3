/**
 * The signs a line of text needs, in order: what the layout calculator
 * places and what the availability check counts. One function for both, so
 * the configurator never offers a style and color that the reservation then
 * can't fill. Spaces are dropped (the yard scene puts word gaps back).
 *
 * Kept dependency-free: client, server and tests all use it.
 */

export type LineElement = { type: 'letter' | 'number' | 'ordinal'; value: string };

/** Years ("Graduation 2026", "Class of 2026") read without an ordinal */
export const isYear = (number: number) => number >= 1900 && number <= 2199;

export function ordinalSuffix(number: number): string {
  const remainder = number % 100;
  if (remainder >= 11 && remainder <= 13) return 'TH';
  switch (number % 10) {
    case 1: return 'ST';
    case 2: return 'ND';
    case 3: return 'RD';
    default: return 'TH';
  }
}

// Where the event number goes in a preset ("HAPPY 40TH BIRTHDAY"): after
// this prefix. Anything else gets the number at the end.
const NUMBER_AFTER: Record<string, string> = {
  HAPPYBIRTHDAY: 'HAPPY',
  HAPPYANNIVERSARY: 'HAPPY',
  CONGRATULATIONS: 'CONGRATULATIONS',
  GRADUATION: '',
};

const letters = (text: string): LineElement[] => [...text].map(value => ({ type: 'letter' as const, value }));

function withNumber(before: string, digits: string, ordinal: string, after: string): LineElement[] {
  return [
    ...letters(before),
    ...[...digits].map(value => ({ type: 'number' as const, value })),
    ...(ordinal ? [{ type: 'ordinal' as const, value: ordinal }] : []),
    ...letters(after),
  ];
}

/** The message line: letters, plus the event number and its ordinal (21 ST) */
export function messageElements(message: string, eventNumber?: number): LineElement[] {
  const clean = message.replace(/\s+/g, '').toUpperCase();

  // A number typed into the message itself ("HAPPY40THBIRTHDAY")
  const typed = clean.match(/(\d+)(ST|ND|RD|TH)?/);
  if (typed && !eventNumber) {
    const at = typed.index ?? 0;
    const digits = typed[1];
    const n = parseInt(digits);
    return withNumber(clean.slice(0, at), digits, typed[2] || (isYear(n) ? '' : ordinalSuffix(n)), clean.slice(at + typed[0].length));
  }

  if (eventNumber) {
    const digits = String(eventNumber);
    const ordinal = isYear(eventNumber) ? '' : ordinalSuffix(eventNumber);
    const pattern = Object.keys(NUMBER_AFTER).find(p => clean.startsWith(p));
    if (pattern === undefined) return withNumber(clean, digits, ordinal, '');
    const cut = NUMBER_AFTER[pattern].length;
    return withNumber(clean.slice(0, cut), digits, ordinal, clean.slice(cut));
  }

  return letters(clean);
}

/** The name line: every character is a sign in the name's style and color */
export function nameElements(name: string): LineElement[] {
  return letters(name.replace(/\s+/g, '').toUpperCase());
}
