import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** Folders already on the brand tokens; raw colors there fail lint. Add each folder as the redesign reaches it. */
export const COLOR_ENFORCED = [
  'src/app/lab/**/*.{ts,tsx}',
  'src/features/yard-scene/**/*.{ts,tsx}',
  // Booking flow (redesigned 2026-10-22). Its display/* preview pieces and
  // the layout calculator's dev colors move with the dashboard redesign.
  'src/app/[[]agency]/booking/**/*.{ts,tsx}',
  'src/features/booking/components/*.{ts,tsx}',
  'src/features/booking/components/steps/**/*.{ts,tsx}',
  'src/features/booking/components/payment-methods/**/*.{ts,tsx}',
  'src/features/booking/components/display/BookingYardPreview.tsx',
  'src/features/booking/components/display/scene-from-layout.ts',
  'src/features/booking/context/**/*.{ts,tsx}',
  'src/features/agency/branding.ts',
  'src/components/payments/**/*.{ts,tsx}',
  'src/components/ui/**/*.{ts,tsx}',
  'src/shared/components/ui/**/*.{ts,tsx}',
  'src/shared/components/feedback/**/*.{ts,tsx}',
  // Marketing site (redesigned 2026-10-22)
  'src/app/page.tsx',
  'src/app/pricing/**/*.{ts,tsx}',
  'src/features/marketing/**/*.{ts,tsx}',
  // Dashboard shell, home and sign-in (redesigned 2026-10-22). Signs and
  // settings join as their PRs land.
  'src/app/[[]agency]/(app)/{layout,loading}.tsx',
  'src/app/[[]agency]/(app)/dashboard/**/*.{ts,tsx}',
  'src/app/[[]agency]/(app)/{inventory,billing}/page.tsx',
  // Orders (redesigned 2026-10-22). Order PDFs keep their own print colors.
  'src/app/[[]agency]/(app)/orders/**/*.{ts,tsx}',
  'src/features/orders/**/*.{ts,tsx}',
  'src/app/auth/**/*.{ts,tsx}',
  'src/features/dashboard/**/*.{ts,tsx}',
  'src/features/agency/components/**/*.{ts,tsx}',
  'src/features/auth/components/auth-frame.tsx',
  'src/features/billing/components/billing-banner.tsx',
  'src/lib/clerk-theme.ts',
];

/** Files whose job is to define colors, and printed documents (PDF/HTML outside the app's theme) */
export const COLOR_EXEMPT = ['src/lib/brand.ts', 'src/shared/components/brand/**', 'src/features/orders/documents/**'];

/** Bans raw hex colors, Tailwind palette classes and the legacy purple theme (DESIGN.md, Color) */
export function colorRules() {
  const hex = '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b'
  const palette = '\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|placeholder|shadow|accent|caret|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b'
  const legacy = '\\b(?:bg|text|border|ring|from|via|to)-(?:primary|secondary-(?:light|pale|gray)|accent-(?:green|pink|yellow|blue)|background-(?:white|light|gray|dark))\\b'
  const rules = [
    [hex, 'Raw hex color. Use a meaning token (bg-action, text-fg...) or COLORS from src/lib/brand.ts. See DESIGN.md.'],
    [palette, 'Tailwind palette class. Use a meaning token (bg-action, text-fg-muted, border-line...). See DESIGN.md.'],
    [legacy, 'Legacy purple theme class. Use the Golden Hour meaning tokens. See DESIGN.md.'],
  ]
  return rules.flatMap(([pattern, message]) => [
    { selector: `Literal[value=/${pattern}/]`, message },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
  ])
}

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable cosmetic/style rules that block deployment
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Disable Next.js warnings that aren't critical
      '@next/next/no-img-element': 'off',

      // Disable React hooks warnings that often have false positives
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // Colors come from the brand tokens. `pnpm lint:colors` lists what's
    // left to migrate outside COLOR_ENFORCED.
    files: COLOR_ENFORCED,
    ignores: COLOR_EXEMPT,
    rules: {
      'no-restricted-syntax': ['error', ...colorRules()],
    },
  },
];

export default eslintConfig;
