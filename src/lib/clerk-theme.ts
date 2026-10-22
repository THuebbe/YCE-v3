import { COLORS, PALETTE } from '@/lib/brand'

/**
 * Clerk's sign-in, sign-up and account widgets in Golden Hour. Clerk builds
 * its hover and border shades from these colors, so they're hex values
 * (from brand.ts), not CSS variables. Fonts are the next/font variables set
 * on <html> in app/layout.tsx.
 */
const DISPLAY_FONT = 'var(--font-fredoka), ui-rounded, system-ui, sans-serif'

export const clerkTheme = {
  variables: {
    colorPrimary: COLORS.action,
    colorTextOnPrimaryBackground: COLORS.onAction,
    colorBackground: COLORS.surface,
    colorInputBackground: COLORS.surface,
    colorInputText: COLORS.text,
    colorText: COLORS.text,
    colorTextSecondary: COLORS.textMuted,
    colorNeutral: PALETTE.ink[900],
    colorDanger: COLORS.danger,
    colorSuccess: COLORS.positive,
    colorWarning: COLORS.caution,
    borderRadius: '8px',
    fontFamily: 'var(--font-nunito-sans), ui-sans-serif, system-ui, sans-serif',
    fontSize: '16px',
  },
  // Style objects, not class names: Clerk's own styles win over classes
  elements: {
    card: { boxShadow: '0 1px 2px rgb(21 29 24 / 0.06), 0 1px 3px rgb(21 29 24 / 0.08)', border: `1px solid ${COLORS.line}`, borderRadius: '12px' },
    headerTitle: { fontFamily: DISPLAY_FONT, fontSize: '1.25rem', fontWeight: 600 },
    formButtonPrimary: { height: '44px', fontSize: '1rem', fontWeight: 700, textTransform: 'none', boxShadow: 'none', backgroundImage: 'none' },
    formFieldInput: { height: '44px', borderColor: PALETTE.ink[400] },
    socialButtonsBlockButton: { height: '44px', borderColor: PALETTE.ink[400] },
    // colorPrimary orange is too light for text on white (2.4:1); links use the darker action text
    footerActionLink: { color: COLORS.actionText, fontWeight: 700, '&:hover': { color: COLORS.actionText } },
    formFieldAction: { color: COLORS.actionText },
    identityPreviewEditButton: { color: COLORS.actionText },
  },
}
