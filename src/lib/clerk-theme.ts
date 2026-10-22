import { COLORS, PALETTE } from '@/lib/brand'

/**
 * Clerk's sign-in, sign-up and account widgets in Golden Hour. Clerk builds
 * its hover and border shades from these colors, so they're hex values
 * (from brand.ts), not CSS variables. Fonts are the next/font variables set
 * on <html> in app/layout.tsx.
 */
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
  elements: {
    // Class names use the meaning tokens (src/styles/tokens.css)
    card: 'shadow-raised border border-line rounded-card',
    headerTitle: 'font-display text-heading font-semibold text-fg',
    headerSubtitle: 'text-fg-muted',
    formButtonPrimary: 'h-11 text-copy font-bold normal-case shadow-none',
    formFieldInput: 'h-11 border-line-strong',
    footerActionLink: 'font-bold text-action-text hover:text-action-text',
    socialButtonsBlockButton: 'h-11 border-line-strong',
    userButtonAvatarBox: 'size-9',
    userButtonPopoverCard: 'shadow-overlay border border-line rounded-card',
  },
}
