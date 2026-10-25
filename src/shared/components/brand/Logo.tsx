import { BRAND, PALETTE } from '@/lib/brand'
import { ICON_Y, WORDMARK } from './logo-geometry'

/**
 * The YardCard Elite logo, drawn as inline SVG so it is crisp at any size
 * and never waits on a font. Size it with a height class (`h-8 w-auto`).
 *
 * - variant="full"      icon + wordmark (default)
 * - variant="icon"      the staked Y on its tile
 * - variant="wordmark"  YardCard ELITE without the icon
 * - tone="onDark"       for the brand green or other dark backgrounds
 * - tone="onHero"       for the orange marketing hero (the orange ELITE
 *                       would vanish there, so it turns white)
 *
 * Brand colors are fixed here on purpose: an agency's white label changes
 * the booking page, never the YardCard Elite logo. Usage rules: DESIGN.md.
 */

type Variant = 'full' | 'icon' | 'wordmark'
type Tone = 'onLight' | 'onDark' | 'onHero'

interface LogoProps {
  variant?: Variant
  tone?: Tone
  className?: string
  /** Accessible name; pass '' when a visible label already names it */
  title?: string
}

/** Icon size and gap in wordmark units (the name is set at 1000) */
const ICON_SIZE = 1550
const GAP = 400
/** Baseline that centers the capitals on the icon */
const BASELINE = ICON_SIZE / 2 + WORDMARK.capHeight / 2

// 8 even waves across the 64-unit tile, then the tile's rounded bottom corners
const GRASS =
  'M0 52' + ' q4 -6 8 0'.repeat(8) +
  'L63.86 52A14 14 0 0 1 50 64H14A14 14 0 0 1 0.14 52Z'

function IconShapes() {
  return (
    <>
      <rect width="64" height="64" rx="14" fill={PALETTE.pine[700]} />
      <g transform="rotate(-5 32 40)">
        {/* H-stake centered under the Y's stem, so the letter stands on it */}
        <rect x="28.6" y="30" width="2.6" height="30" rx="1" fill={PALETTE.stake} />
        <rect x="33.4" y="30" width="2.6" height="30" rx="1" fill={PALETTE.stake} />
        <path d={ICON_Y} fill={PALETTE.tangerine[500]} stroke={PALETTE.ink[0]} strokeWidth="4.5" strokeLinejoin="round" paintOrder="stroke" />
      </g>
      <path d={GRASS} fill={PALETTE.pine[500]} />
    </>
  )
}

const WORDMARK_FILLS: Record<Tone, { name: string; elite: string }> = {
  onLight: { name: PALETTE.pine[700], elite: PALETTE.tangerine[700] },
  onDark: { name: PALETTE.ink[0], elite: PALETTE.tangerine[500] },
  onHero: { name: PALETTE.pine[800], elite: PALETTE.ink[0] },
}

function WordmarkShapes({ tone }: { tone: Tone }) {
  const fills = WORDMARK_FILLS[tone]
  return (
    <>
      <path d={WORDMARK.name} fill={fills.name} />
      <path d={WORDMARK.elite} fill={fills.elite} />
    </>
  )
}

export function Logo({ variant = 'full', tone = 'onLight', className, title = BRAND.name }: LogoProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const }
  const { box } = WORDMARK

  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 64 64" className={className} {...a11y}>
        <IconShapes />
      </svg>
    )
  }

  if (variant === 'wordmark') {
    return (
      <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} className={className} {...a11y}>
        <WordmarkShapes tone={tone} />
      </svg>
    )
  }

  const width = ICON_SIZE + GAP + box.x + box.width
  return (
    <svg viewBox={`0 0 ${width} ${ICON_SIZE}`} className={className} {...a11y}>
      <g transform={`scale(${ICON_SIZE / 64})`}>
        <IconShapes />
      </g>
      <g transform={`translate(${ICON_SIZE + GAP} ${BASELINE})`}>
        <WordmarkShapes tone={tone} />
      </g>
    </svg>
  )
}
