import { SIGN_CHARACTERS, type StockSnapshot } from '@/features/booking/availability'
import { addDays } from '@/features/booking/booking-rules'
import { MOCK_BACKDROPS, MOCK_BOOKENDS, MOCK_DECORATIONS, MOCK_ORDINALS, backdropKey, bookendKey, decorationKey, ordinalKey } from '@/features/booking/services/catalog-keys'

const COLORWAYS = ['red', 'blue', 'pink', 'gold', 'green', 'purple', 'black']
const PUNCT: Record<string, string> = { '!': 'exclamation', '?': 'question', '&': 'ampersand', "'": 'apostrophe', '.': 'period', ',': 'comma', '-': 'hyphen' }

/**
 * A stand-in agency's stock for /lab/booking: every character in classic,
 * in seven colors, `perSign` of each. With `busy`, someone else has most of
 * the letters booked for the weekend two weeks out, so those days go gray.
 */
export function demoSnapshot({ perSign, busy, today }: { perSign: number; busy: boolean; today: string }): StockSnapshot {
  const signs: StockSnapshot['signs'] = []
  for (const colorway of COLORWAYS) {
    for (const character of SIGN_CHARACTERS) {
      const type = /\d/.test(character) ? 'number' : PUNCT[character] ? 'punctuation' : 'letter'
      const slug = PUNCT[character] ?? character.toLowerCase()
      const key = `${type === 'punctuation' ? 'punct' : type}-${slug}-classic-${colorway}`
      signs.push({ id: key, key, type, character, style: 'classic', colorway, quantity: perSign })
    }
  }
  for (const o of MOCK_ORDINALS) signs.push({ id: ordinalKey(o), key: ordinalKey(o), type: 'ordinal', character: o, style: null, colorway: null, quantity: perSign })
  for (const d of MOCK_DECORATIONS) signs.push({ id: decorationKey(d), key: decorationKey(d), type: 'decoration', character: null, style: null, colorway: null, quantity: perSign })
  for (const b of MOCK_BACKDROPS) signs.push({ id: backdropKey(b), key: backdropKey(b), type: 'backdrop', character: null, style: null, colorway: null, quantity: perSign })
  for (const b of MOCK_BOOKENDS) signs.push({ id: bookendKey(b), key: bookendKey(b), type: 'bookend', character: null, style: null, colorway: null, quantity: perSign })

  const holds: StockSnapshot['holds'] = []
  if (busy) {
    // Saturday at least two weeks out, held Friday through Monday
    const start = new Date(`${addDays(today, 14)}T12:00:00Z`)
    const saturday = addDays(today, 14 + ((6 - start.getUTCDay() + 7) % 7))
    holds.push({
      kind: 'temporary',
      start: addDays(saturday, -1),
      end: addDays(saturday, 2),
      mine: false,
      items: signs.filter(s => s.type === 'letter').map(s => ({ signId: s.id, quantity: Math.max(0, perSign - 1) })),
    })
  }
  return { signs, holds }
}
