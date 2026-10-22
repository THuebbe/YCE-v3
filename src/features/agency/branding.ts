import type { CSSProperties } from 'react'
import { agencyThemeVars } from '@/lib/brand'
import { hasFeature, planOf } from '@/features/billing/entitlements'

/**
 * An agency's white label for its booking page (DESIGN.md "White label"),
 * stored in agencies.branding. Every field is optional and validated here:
 * anything missing or malformed falls back to the YardCard Elite defaults,
 * so a bad value can never break a booking page.
 *
 * Saved from Settings > Booking page (features/agency/branding-actions.ts).
 * Display code reads it through activeBranding(), never parseBranding()
 * directly: white label is Elite.
 */
export interface AgencyBranding {
  /** Header and bands, #RRGGBB */
  brandColor?: string
  /** Buttons and links, #RRGGBB; without it the brand color does both */
  accentColor?: string
  /** https URL of the agency's logo, shown in the booking header */
  logoUrl?: string
}

const HEX = /^#[0-9a-fA-F]{6}$/

function hex(value: unknown): string | undefined {
  return typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : undefined
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    return new URL(value).protocol === 'https:' ? value : undefined
  } catch {
    return undefined
  }
}

export function parseBranding(raw: unknown): AgencyBranding {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const branding: AgencyBranding = {
    brandColor: hex(r.brandColor),
    accentColor: hex(r.accentColor),
    logoUrl: httpsUrl(r.logoUrl),
  }
  // An accent alone is a fine brand color too
  if (!branding.brandColor && branding.accentColor) {
    branding.brandColor = branding.accentColor
    branding.accentColor = undefined
  }
  return branding
}

/**
 * The branding to show for an agency: its saved branding on Elite, none on
 * Essentials. A downgraded agency keeps what it saved; it shows again if it
 * upgrades.
 */
export function activeBranding(agency: { plan?: string | null; branding?: unknown } | null | undefined): AgencyBranding {
  return hasFeature(planOf(agency), 'whiteLabel') ? parseBranding(agency?.branding) : {}
}

/**
 * Inline style for the [data-agency] wrapper: re-skins the meaning tokens
 * with the agency's colors (contrast fixed by agencyThemeVars). Undefined
 * when the agency hasn't chosen colors, so the Golden Hour defaults apply.
 */
export function brandingStyle(branding: AgencyBranding): CSSProperties | undefined {
  if (!branding.brandColor) return undefined
  return agencyThemeVars({ brand: branding.brandColor, accent: branding.accentColor }) as CSSProperties
}
