# YardCard Elite design rules

How YardCard Elite looks, sounds and moves. **Exciting, easy, modern.**
The rules are here in words; `/lab/brand` (preview deployments and
`pnpm dev` only) shows them rendered from the real tokens.

Replaces the old purple `style-guide/style-guide.md` (still in git history).

## Where things live

| What | File |
|---|---|
| Name, logo paths, hex values for email/PDF, contrast helpers | `src/lib/brand.ts` |
| CSS tokens (palette, meaning, component) | `src/styles/tokens.css` |
| The logo | `src/shared/components/brand/Logo.tsx` |
| Logo files (`/public/brand`, favicon, iPhone icon) | generated: `pnpm brand:logo` |
| Logo letter outlines | generated: `scripts/brand/build-logo-geometry.py` |

Change the logo or a brand color in one place, then regenerate. Never edit
generated files by hand.

## Logo

A yard-card **Y** standing on its H-stake in the grass, then **YardCard ELITE**.

- Use `<Logo />` in the app: `variant="full" | "icon" | "wordmark"`, `tone="onDark"` on the brand green. Size it with a height class.
- Clear space: half the icon's height on every side.
- Minimum size: full logo 24px tall; below that, the icon alone (works down to 16px).
- ELITE always sits with YardCard. It is part of the name: Elite is the full experience, and the name says so.
- Don't recolor, stretch, rotate, outline, shadow or animate the logo (the hero's drop-in uses yard signs, not the logo).
- The logo never takes an agency's colors. White label changes the booking page, not our mark.
- The Y and stakes are a font letter for now (Lilita One). Redraw by hand before print or large signage.

## Color: Golden Hour

Warm orange for action, deep pine for the brand, a little sky blue for detail.
Summer evening at the park.

**Components use meaning tokens only** (`bg-action`, `text-fg-muted`,
`border-line-strong`). Palette names (`--tangerine-500`) exist only to build
the meaning layer. Raw hex values and Tailwind palette classes
(`bg-purple-600`) fail lint in migrated folders.

| Token | Use | Text contrast |
|---|---|---|
| `action` / `on-action` | The one main button per screen. **Dark text, never white** (white is 2.4:1) | 7.3:1 |
| `action-text` | Orange as text or links on light backgrounds | 4.9:1 |
| `brand` / `on-brand` | Headers, brand bands, logo tile | 9.6:1 |
| `brand-accent` | Orange on green: large text and marks only | 4.1:1 |
| `highlight` | Sky blue for dots, chart lines, illustration. Never text | n/a |
| `lawn` | Grass in the logo and yard scene | n/a |
| `fg` / `fg-muted` | Body text / secondary text | 16.9:1 / 7.4:1 |
| `canvas` / `surface` / `surface-sunken` | Page / cards and inputs / wells | |
| `line` / `line-strong` | Dividers / input and control borders (3.2:1) | |
| `positive`, `caution`, `danger`, `notice` (+ `-soft`) | Status. Caution is amber, kept apart from the brand orange | all ≥ 4.5:1 |
| `focus` | Focus ring | |

Rules:
- WCAG AA everywhere: 4.5:1 for text, 3:1 for large text and controls.
- One orange button per screen. Everything else is the outlined button or a link.
- Color never carries meaning alone: status chips have words, errors have text.
- Light theme only in v1. No dark mode until someone asks for it.

## Type

- **Fredoka** (rounded, friendly) for headings, big numbers and the wordmark only. Weight 600; 700 is the wordmark's.
- **Nunito Sans** for everything people read. 400 for text, 700 for emphasis and buttons.
- Six sizes, nothing in between: `text-hero` (grows with the screen), `text-title` 28, `text-heading` 20, `text-lead` 18, `text-copy` 16, `text-fine` 14.
- Body text is never under 16px on phones (it also stops iOS zooming into inputs).
- Lines of reading text stay under about 70 characters (`max-w-prose`).

## Space and shape

- 8px grid. Tailwind spacing in even steps: 2, 4, 6, 8, 12, 16 (8, 16, 24, 32, 48, 64px). Odd steps only inside a component that needs 4px.
- One radius per size: `rounded-control` 8px (buttons, inputs, chips), `rounded-card` 12px, `rounded-sheet` 16px (modals, sheets, the yard scene). No `rounded-full` except avatars and dots.
- Two shadows: `shadow-raised`, `shadow-overlay`. Borders do most of the separating.
- Touch targets at least 44px (`--button-height`). Inputs 48px.

## Layout

- Mobile first. Design at 375px, then widen. Responsive is not optional.
- Left-aligned text. Center only short hero lines and empty states.
- The product is the picture: show yard displays, not stock photos, blobs or gradients.

## Avoid the "made by AI" look

None of these, unless there's a specific reason:
- Purple-to-blue gradients, gradient text, glowing blobs, glassmorphism
- Inter, Space Grotesk or a serif display "for elegance"
- Emoji as icons or section markers
- Everything centered; three identical feature cards with icons on top
- `rounded-2xl` and a shadow on every box; colored accent bars on cards
- Numbered markers (01 / 02 / 03) on things that aren't steps
- Copy like "Supercharge", "Seamless", "Unlock", "Elevate", "Effortless"
- Fake testimonials, fake logos, fake stats

## Voice (approved 2026-10-22)

Plain, upbeat, short. A friendly neighbor who runs a tight operation:
excited about the party, precise about the details.

**To agencies** (dashboard, emails, marketing): a capable business partner.
Confident and direct, never salesy. Exact with money and dates.
- Say: "3 displays go up this weekend." "Payment failed. We'll retry Thursday. Update the card to fix it now."
- Not: "Oops! Something went wrong", "Supercharge your rental business!", "Your webhook configuration is invalid."

**On booking pages** (the agency's customers): warm and celebratory, in the
agency's name. Short steps, no jargon, every price shown before paying.
- Say: "Who are we celebrating?" "We set up the night before and pick up the day after."
- Not: "Enter recipient name (required)", "Delivery logistics", "Submit order".

**Words**: *display* (what the customer gets), *booking* (customer side) vs
*order* (agency dashboard only), *setup* and *pickup* (not delivery and
removal), *signs* or *letters* (not cards or inventory) with customers.

**Errors** say what happened and what to do next. No apologies, no "oops",
no emoji. Buttons say exactly what they do ("Book this display", not
"Submit").

## White label (decided 2026-10-22)

On booking pages the agency is the brand.

- **Agencies choose**: a **brand color** (header and bands) and an
  **accent color** (buttons and links; optional, the brand color does both
  without it), their logo and business name, and (Elite) their policy
  values: cancellation notice and fee, late fee, damage fee per sign. The
  terms wording is generated from those values (`features/booking/terms.ts`);
  agencies never write terms text.
- **We keep fixed**: all wording, including the generated terms (steps,
  buttons, messages, policy text),
  layout, fonts, the yard scene, status colors, and "Powered by YardCard
  Elite" in the footer **on every plan**.
- Contrast is automatic: `agencyThemeVars({ brand, accent })` in `brand.ts`
  picks dark or white text for each color, darkens a mid-tone accent just
  enough for white button text to pass, darkens the accent for links, and
  replaces an accent that blends into the brand color (under 3:1) on brand
  bands.
- How: the booking layout sets `data-agency` and
  `style={agencyThemeVars(...)}` on its wrapper; everything built on meaning
  tokens re-skins itself.
- Not built yet: storing the two colors (agency settings validation has
  `primaryColor` / `secondaryColor`, but no column or settings screen) comes
  with the booking redesign. Plan gating (Elite feature vs $5 add-on) is
  still open.

## Motion

One moment, done well: **signs drop into the lawn** one letter after another
and settle with a little bounce (`sign-drop` keyframes, `--duration-drop`
450ms, `--drop-stagger` 60ms, `--ease-drop`). When the name changes, only the
changed letters drop again.

Everything else moves only to show a change: 150–200ms, `--ease-out`.
No scroll-triggered fade-ins, no parallax, nothing that loops.

`prefers-reduced-motion` sets drop timing to zero: the display just appears.

## Email and PDF

Use `COLORS` and `BRAND.logo.emailPng` (600px wide, shown at 300px) from
`src/lib/brand.ts`. Email clients don't load our CSS or SVG.

## Migrating from the purple theme

The legacy purple tokens in `globals.css` stay until every screen has moved.
Each redesign PR:
1. Rebuilds its screens on the meaning tokens.
2. Adds its folders to `COLOR_ENFORCED` in `eslint.config.mjs`, so raw colors there fail lint from then on.
3. Checks `pnpm lint:colors`: the count only goes down.

Order: booking flow, then marketing site, then dashboard. When the count
reaches zero, delete the legacy block in `globals.css` and enforce
everywhere.

## Not decided yet (on purpose)

Photography rules (waiting on the Victory sign photos), illustration style
beyond the hero, social and print templates. Decide these with real
material, not before.
