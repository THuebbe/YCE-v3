import type { SceneItem } from '@/features/yard-scene/YardScene'
import type { SignAsset } from '../../services/sign-assets'
import type { LayoutCalculation, ZoneSign } from '../../types'

/**
 * Turns the layout calculator's zones into yard scene rows, so the booking
 * preview shows exactly the signs a reservation holds.
 *
 *   back row:  backdrops | message (zone 1, with number and ordinal) | backdrops
 *   front row: bookend | decorations | name (zone 2) | decorations | bookend
 *
 * Signs with art (letters, numbers, stars, hearts) use their manifest image
 * and real size; the rest are drawn as labelled boards until their art
 * exists. The calculator drops spaces, so word gaps come back from the
 * message and name as typed.
 */

const GROUP_GAP_IN = 8
/** Sizes for signs without artwork yet, in inches */
const BOARD = {
  letter: { widthIn: 24, heightIn: 28 },
  number: { widthIn: 22, heightIn: 28 },
  ordinal: { widthIn: 14, heightIn: 14 },
  decoration: { widthIn: 24, heightIn: 24 },
  backdrop: { widthIn: 30, heightIn: 34 },
  bookend: { widthIn: 16, heightIn: 36 },
} as const

/** "decoration-Baseball Bat-3" -> "Baseball Bat" */
function nameFromSignId(signId: string): string {
  const parts = signId.split('-')
  return parts.slice(1, -1).join(' ') || signId
}

function item(sign: ZoneSign, byFile: Map<string, SignAsset>, gapBeforeIn?: number): SceneItem {
  const file = sign.style.prod?.imageUrl?.replace(/^\/sign-assets\//, '')
  const asset = file ? byFile.get(file) : undefined
  const label = sign.character ?? nameFromSignId(sign.signId)
  if (asset) {
    return { id: sign.catalogKey ?? asset.id, file: asset.file, label, widthIn: asset.widthIn, heightIn: asset.heightIn, baselineYPct: asset.baselineYPct, gapBeforeIn }
  }
  const board = BOARD[sign.type as keyof typeof BOARD] ?? BOARD.decoration
  return { id: sign.catalogKey ?? sign.signId, label, ...board, gapBeforeIn }
}

/** Word gaps for a row: from the text as typed, and around a number */
function lineItems(signs: ZoneSign[], typed: string, byFile: Map<string, SignAsset>): SceneItem[] {
  // Indexes into the typed letters (spaces removed) that start a new word
  const wordStarts = new Set<number>()
  let letterIndex = 0
  let afterSpace = false
  for (const ch of typed.toUpperCase()) {
    if (/\s/.test(ch)) { afterSpace = letterIndex > 0; continue }
    if (afterSpace) wordStarts.add(letterIndex)
    afterSpace = false
    letterIndex++
  }

  let letters = 0
  let prevType: ZoneSign['type'] | null = null
  return [...signs].sort((a, b) => a.position - b.position).map(sign => {
    const isLetter = sign.type === 'letter'
    const startsWord = isLetter && wordStarts.has(letters)
    const numberEdge = prevType !== null && (isLetter ? prevType !== 'letter' : prevType === 'letter')
    if (isLetter) letters++
    prevType = sign.type
    return item(sign, byFile, startsWord || numberEdge ? GROUP_GAP_IN : undefined)
  })
}

export function sceneRowsFromLayout(
  layout: LayoutCalculation,
  typed: { message: string; name: string },
  byFile: Map<string, SignAsset>,
): SceneItem[][] {
  const sorted = (signs: ZoneSign[]) => [...signs].sort((a, b) => a.position - b.position)
  const withGap = (items: SceneItem[]) => items.map((it, i) => (i === 0 ? { ...it, gapBeforeIn: GROUP_GAP_IN } : it))

  const backdrops = sorted(layout.zone4.signs).map(s => item(s, byFile))
  const half = Math.ceil(backdrops.length / 2)
  const message = lineItems(layout.zone1.signs, typed.message, byFile)
  const back = [...backdrops.slice(0, half), ...withGap(message), ...withGap(backdrops.slice(half))]

  const bookends = sorted(layout.zone5.signs)
  const left = sorted(layout.zone3.signs.filter(s => s.side === 'left')).map(s => item(s, byFile))
  const right = sorted(layout.zone3.signs.filter(s => s.side !== 'left')).map(s => item(s, byFile))
  const name = lineItems(layout.zone2.signs, typed.name, byFile)
  const front = [
    ...bookends.filter(s => s.position === 0).map(s => item(s, byFile)),
    ...withGap(left),
    ...withGap(name),
    ...withGap(right),
    ...withGap(bookends.filter(s => s.position !== 0).map(s => item(s, byFile))),
  ]
  // A leading gap on the first sign would just push the row off center
  if (front[0]) front[0] = { ...front[0], gapBeforeIn: undefined }
  if (back[0]) back[0] = { ...back[0], gapBeforeIn: undefined }
  return [back, front]
}

/** What the display says, for screen readers */
export function describeLayout(layout: LayoutCalculation): string {
  const text = (signs: ZoneSign[]) => [...signs].sort((a, b) => a.position - b.position).map(s => s.character ?? '').join('')
  return `${text(layout.zone1.signs)} ${text(layout.zone2.signs)}`.trim()
}
