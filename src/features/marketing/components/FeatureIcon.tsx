import { PALETTE } from '@/lib/brand'

/**
 * Our own icon set: each one is a little yard sign on two stakes (the logo's
 * idea at feature size), a pine panel carrying a white glyph with one orange
 * detail. Decorative: the feature's title says what it means.
 */

export type FeatureIconName = 'preview' | 'paid' | 'calendar' | 'orders' | 'brand' | 'rules'

const INK = PALETTE.ink[0]
const ACCENT = PALETTE.tangerine[500]
const line = { fill: 'none', stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const GLYPHS: Record<FeatureIconName, React.ReactNode> = {
  // the customer watching their display
  preview: (
    <>
      <path d="M15 22Q32 7 49 22Q32 37 15 22Z" {...line} />
      <circle cx="32" cy="22" r="5.5" fill={ACCENT} />
    </>
  ),
  paid: (
    <>
      <path d="M32 9V35" {...line} />
      <path d="M39 15Q35 12 30 12.5Q24.5 13.5 25 18Q25.5 21 32 22.5Q39 24 39 28Q38.5 32.5 32 32.5Q27 32.5 24.5 29.5" {...line} stroke={ACCENT} />
    </>
  ),
  calendar: (
    <>
      <rect x="17" y="12" width="30" height="22" rx="3" {...line} />
      <path d="M17 18.5H47M24 9V14M40 9V14" {...line} />
      <path d="M25 26L29.5 30L38.5 22.5" {...line} stroke={ACCENT} />
    </>
  ),
  orders: (
    <>
      <rect x="20" y="10" width="24" height="26" rx="3" {...line} />
      <path d="M27 10V8H37V10" {...line} />
      <path d="M25.5 18.5H38.5" {...line} stroke={ACCENT} />
      <path d="M25.5 24H38.5M25.5 29.5H33" {...line} />
    </>
  ),
  // your flag planted on the page
  brand: (
    <>
      <path d="M22 35V9" {...line} />
      <path d="M22 10.5H45L40 17L45 23.5H22Z" fill={ACCENT} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  rules: (
    <>
      <path d="M16 14H48M16 22H48M16 30H48" {...line} />
      <circle cx="26" cy="14" r="4" fill={ACCENT} stroke={INK} strokeWidth={2.5} />
      <circle cx="39" cy="22" r="4" fill={ACCENT} stroke={INK} strokeWidth={2.5} />
      <circle cx="29" cy="30" r="4" fill={ACCENT} stroke={INK} strokeWidth={2.5} />
    </>
  ),
}

// eight waves of grass over the stake feet
const GRASS = 'M0 57' + ' q4 -5 8 0'.repeat(8) + 'V64H0Z'

export function FeatureIcon({ name, className }: { name: FeatureIconName; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="24" y="34" width="3" height="26" rx="1" fill={PALETTE.stake} />
      <rect x="37" y="34" width="3" height="26" rx="1" fill={PALETTE.stake} />
      <g transform="rotate(-4 32 22)">
        <rect x="8" y="3" width="48" height="38" rx="8" fill={PALETTE.pine[700]} />
        {GLYPHS[name]}
      </g>
      <path d={GRASS} fill={PALETTE.pine[500]} />
    </svg>
  )
}
