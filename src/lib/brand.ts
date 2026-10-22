/**
 * YardCard Elite brand: the one place for the name, logo files, colors and
 * fonts. CSS reads the same colors from src/styles/tokens.css; keep the two
 * in sync. Hex values live here for places CSS can't reach: emails, PDFs,
 * the Stripe and Clerk themes, and the agency white-label contrast checks.
 *
 * Rules for using all of this are in DESIGN.md.
 */

export const BRAND = {
  name: 'YardCard Elite',
  /** Shortest form, for tight spaces like a phone home screen label */
  shortName: 'YardCard',
  logo: {
    /** Full lockup (icon + wordmark) for light backgrounds */
    full: '/brand/logo.svg',
    /** Full lockup for the brand green or other dark backgrounds */
    fullOnDark: '/brand/logo-on-green.svg',
    icon: '/brand/icon.svg',
    /** PNG lockup for email clients that don't show SVG (600px wide) */
    emailPng: '/brand/logo-email.png',
  },
} as const

/** Golden Hour palette (chosen 2026-10-22). Palette names stay out of components: use the meaning tokens. */
export const PALETTE = {
  tangerine: {
    50: '#FFF4EC', 100: '#FFE3CF', 200: '#FFC59E', 300: '#FFA76E', 400: '#FF9750',
    500: '#FF8A3D', 600: '#F2702A', 700: '#B8520F', 800: '#8A3D0B', 900: '#5C2907',
  },
  pine: {
    50: '#EEF5F1', 100: '#D5E8DD', 200: '#A9CFB9', 300: '#74B08E', 400: '#45906A',
    500: '#2E7D4F', 600: '#256541', 700: '#1F4D3A', 800: '#173B2C', 900: '#0F271D',
  },
  bluebird: {
    50: '#EDF7FD', 100: '#D3ECFA', 300: '#8ACFF1', 500: '#4AB3E8', 700: '#1B74A3', 900: '#0E3F5A',
  },
  /** Neutrals with a slight green bias so greys sit with the brand */
  ink: {
    0: '#FFFFFF', 25: '#F7F8F6', 50: '#F1F3F0', 100: '#E4E8E3', 200: '#CDD4CE', 300: '#AEB8B0',
    400: '#87938A', 500: '#66736A', 600: '#4C5850', 700: '#36423A', 800: '#232D27', 900: '#151D18',
  },
  red: { 50: '#FDEDEC', 600: '#C62828', 800: '#8E1B1B' },
  amber: { 50: '#FFF7DB', 400: '#F2B705', 800: '#7A5200' },
  /** Stake wood, used only in the logo and the yard scene */
  stake: '#D8C3A0',
} as const

/** Colors by job, for emails and PDFs. Mirrors the meaning layer in tokens.css. */
export const COLORS = {
  brand: PALETTE.pine[700],
  action: PALETTE.tangerine[500],
  onAction: PALETTE.ink[900],
  actionText: PALETTE.tangerine[700],
  highlight: PALETTE.bluebird[500],
  canvas: PALETTE.ink[25],
  surface: PALETTE.ink[0],
  text: PALETTE.ink[900],
  textMuted: PALETTE.ink[600],
  line: PALETTE.ink[200],
  positive: PALETTE.pine[600],
  caution: PALETTE.amber[800],
  danger: PALETTE.red[600],
  info: PALETTE.bluebird[700],
} as const

export const FONTS = {
  /** Headings, the wordmark, big numbers. Rounded and friendly; use with restraint. */
  display: 'Fredoka',
  /** Everything people read: body text, forms, tables */
  body: 'Nunito Sans',
} as const

// --- Contrast helpers (WCAG 2.x) ---------------------------------------------

function channels(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Dark ink or white, whichever reads better on the given background */
export function readableOn(bg: string): string {
  return contrast(bg, PALETTE.ink[900]) >= contrast(bg, '#FFFFFF') ? PALETTE.ink[900] : '#FFFFFF'
}

/** Darken a color step by step until it reaches the target contrast against `against` */
export function darkenTo(hex: string, against: string, target = 4.5): string {
  let rgb = channels(hex)
  for (let i = 0; i < 40 && contrast(toHex(rgb), against) < target; i++) {
    rgb = rgb.map(v => v * 0.93) as [number, number, number]
  }
  return toHex(rgb)
}

/**
 * CSS variables that re-skin the meaning layer with an agency's own colors
 * (white label). Applied as inline style on the [data-agency] wrapper.
 *
 * - brand: headers and bands (our pine's job)
 * - accent: buttons and links, the thing customers click (our orange's job).
 *   Optional; without it the brand color does both jobs.
 *
 * Agencies pick freely; contrast is fixed for them. A pale yellow still gets
 * readable text, and an accent too close to the brand color is replaced on
 * brand bands so it can't disappear there.
 */
export function agencyThemeVars({ brand, accent }: { brand: string; accent?: string }): Record<string, string> {
  const picked = accent ?? brand
  const onBrand = readableOn(brand)
  // Mid-tones (a bright red) can fail with both dark and white text; darken
  // those just enough for white text to pass AA
  const action = contrast(picked, readableOn(picked)) >= 4.5 ? picked : darkenTo(picked, '#FFFFFF', 4.5)
  return {
    '--color-brand': brand,
    '--color-on-brand': onBrand,
    '--color-brand-accent': contrast(picked, brand) >= 3 ? picked : onBrand,
    '--color-action': action,
    '--color-action-hover': toHex(channels(action).map(v => v * 0.9) as [number, number, number]),
    '--color-on-action': readableOn(action),
    '--color-action-text': darkenTo(picked, '#FFFFFF', 4.5),
  }
}
