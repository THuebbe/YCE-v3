import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Logo } from '@/shared/components/brand/Logo'
import { BRAND, COLORS, PALETTE, agencyThemeVars, contrast, readableOn } from '@/lib/brand'
import { DropDemo } from './DropDemo'

export const metadata: Metadata = { title: `Brand - ${BRAND.name}` }

/*
 * The living style guide. Everything here renders from the real tokens and
 * components, so it can't drift from the app. The rules in words are in
 * DESIGN.md; this page shows them.
 */

const SECTIONS = [
  ['logo', 'Logo'], ['color', 'Color'], ['type', 'Type'], ['shape', 'Space and shape'],
  ['components', 'Building blocks'], ['voice', 'Voice'], ['white-label', 'White label'], ['motion', 'Motion'],
] as const

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line py-12 first:border-t-0">
      <h2 className="font-display text-title font-semibold">{title}</h2>
      {intro && <div className="mt-2 max-w-prose text-copy text-fg-muted">{intro}</div>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

function Ratio({ fg, bg }: { fg: string; bg: string }) {
  const r = contrast(fg, bg)
  const grade = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'Large text only' : 'Not for text'
  return <span className="tabular-nums">{r.toFixed(1)}:1 · {grade}</span>
}

const SWATCHES: { name: string; className: string; hex: string; textOn?: string; use: string }[] = [
  { name: 'action', className: 'bg-action', hex: COLORS.action, textOn: COLORS.onAction, use: 'The one main button per screen. Dark text on it, never white.' },
  { name: 'brand', className: 'bg-brand', hex: COLORS.brand, textOn: PALETTE.ink[0], use: 'Headers, brand bands, the logo tile.' },
  { name: 'action-text', className: 'bg-action-text', hex: COLORS.actionText, textOn: PALETTE.ink[0], use: 'Orange as text or links on light backgrounds.' },
  { name: 'highlight', className: 'bg-highlight', hex: COLORS.highlight, use: 'Small details only: dots, chart lines, illustrations. Never text.' },
  { name: 'fg', className: 'bg-fg', hex: COLORS.text, textOn: PALETTE.ink[0], use: 'Body text.' },
  { name: 'fg-muted', className: 'bg-fg-muted', hex: COLORS.textMuted, textOn: PALETTE.ink[0], use: 'Secondary text, hints, timestamps.' },
  { name: 'canvas', className: 'bg-canvas', hex: COLORS.canvas, textOn: COLORS.text, use: 'Page background.' },
  { name: 'surface', className: 'bg-surface', hex: COLORS.surface, textOn: COLORS.text, use: 'Cards, sheets, inputs.' },
  { name: 'line', className: 'bg-line', hex: COLORS.line, use: 'Dividers. Too light for input borders: use line-strong.' },
  { name: 'positive', className: 'bg-positive', hex: COLORS.positive, textOn: PALETTE.ink[0], use: 'Paid, confirmed, set up.' },
  { name: 'caution', className: 'bg-caution', hex: COLORS.caution, textOn: PALETTE.ink[0], use: 'Needs attention soon. Kept apart from the brand orange.' },
  { name: 'danger', className: 'bg-danger', hex: COLORS.danger, textOn: PALETTE.ink[0], use: 'Errors, cancel, refund.' },
  { name: 'notice', className: 'bg-notice', hex: COLORS.info, textOn: PALETTE.ink[0], use: 'Neutral information.' },
]

const TYPE = [
  ['text-hero', 'font-display font-semibold', 'Book a yard display'],
  ['text-title', 'font-display font-semibold', 'Your display is booked'],
  ['text-heading', 'font-display font-semibold', 'Setup and pickup'],
  ['text-lead', '', 'We set up the night before, so the display is there when they wake up.'],
  ['text-copy', '', 'Pick the date, the message and the colors. We bring the signs, set them up and pick them up.'],
  ['text-fine', '', 'Free cancellation up to 48 hours before setup.'],
] as const

// Sample agency picks to show the contrast fixing; real ones come from agency settings.
// Blue Ribbon's accent is deliberately too close to its brand color.
/* eslint-disable no-restricted-syntax */
const AGENCIES = [
  { name: 'Lucky Lawn Signs', brand: '#6B2D8C', accent: '#FFB703' },
  { name: 'Sunny Side Cards', brand: '#FFE14D', accent: '#E63946' },
  { name: 'Blue Ribbon Yard Greetings', brand: '#1E40AF', accent: '#2F5BD3' },
]
/* eslint-enable no-restricted-syntax */

export default function BrandPage() {
  return (
    <>
      <header className="bg-brand text-on-brand">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <Logo tone="onDark" className="h-auto w-full max-w-xs sm:max-w-sm" />
          <h1 className="mt-6 font-display text-hero font-semibold">Brand</h1>
          <p className="mt-2 max-w-prose text-lead opacity-90">
            How YardCard Elite looks and sounds. This page renders from the real tokens and components, so it is
            always current. The rules in words are in DESIGN.md.
          </p>
          <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-fine font-semibold" aria-label="Sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="underline-offset-4 hover:underline">{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <Section
          id="logo"
          title="Logo"
          intro="A yard card letter on its stakes, then the name. Use the files as they are: no recoloring, stretching, outlines or shadows, and never split ELITE from YardCard."
        >
          <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
            <div className="flex items-center justify-center rounded-card border border-line bg-surface p-10">
              <Logo className="h-auto w-full max-w-sm" />
            </div>
            <div className="flex items-center justify-center rounded-card bg-brand p-10">
              <Logo tone="onDark" className="h-auto w-full max-w-sm" />
            </div>
          </div>

          <h3 className="mt-10 font-display text-heading font-semibold">Clear space and minimum size</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="inline-block w-full max-w-sm border border-dashed border-highlight p-[8%]">
                <Logo className="h-auto w-full max-w-sm" />
              </div>
              <p className="mt-4 text-fine text-fg-muted">Keep space around the logo equal to half the icon&apos;s height. Nothing else sits inside it.</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex flex-wrap items-end gap-6">
                {([[96, 'size-24'], [48, 'size-12'], [32, 'size-8'], [16, 'size-4']] as const).map(([px, size]) => (
                  <figure key={px} className="text-center">
                    <Logo variant="icon" className={`mx-auto ${size}`} title="" />
                    <figcaption className="mt-1 text-fine text-fg-muted tabular-nums">{px}px</figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-4 text-fine text-fg-muted">
                Full logo: at least 24px tall. Below that, use the icon alone. The icon works down to 16px (browser tabs).
              </p>
            </div>
          </div>

          <h3 className="mt-10 font-display text-heading font-semibold">Files</h3>
          <ul className="mt-3 grid gap-1 text-copy">
            <li><code className="text-fine">{BRAND.logo.full}</code>: light backgrounds</li>
            <li><code className="text-fine">{BRAND.logo.fullOnDark}</code>: the brand green and dark backgrounds</li>
            <li><code className="text-fine">{BRAND.logo.icon}</code>: icon, also the favicon</li>
            <li><code className="text-fine">{BRAND.logo.emailPng}</code>: emails (show at 300px wide)</li>
          </ul>
          <p className="mt-3 text-fine text-fg-muted">In the app, use the <code>Logo</code> component. All files are generated from it with <code>pnpm brand:logo</code>.</p>
        </Section>

        <Section
          id="color"
          title="Color"
          intro={<>Golden Hour: warm orange for action, deep pine for the brand, a little sky blue for detail. Components use these <strong>meaning</strong> names (<code>bg-action</code>), never raw colors. Contrast is measured live.</>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SWATCHES.map(s => (
              <div key={s.name} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className={`${s.className} flex h-20 items-end p-3`}>
                  {s.textOn && <span className="font-semibold" style={{ color: s.textOn }}>Aa</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <code className="font-semibold">{s.name}</code>
                    <span className="text-fine text-fg-muted tabular-nums">{s.hex}</span>
                  </div>
                  <p className="mt-1 text-fine text-fg-muted">{s.use}</p>
                  {s.textOn && <p className="mt-2 text-fine"><Ratio fg={s.textOn} bg={s.hex} /></p>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-prose text-fine text-fg-muted">
            White on the action orange measures <Ratio fg={PALETTE.ink[0]} bg={COLORS.action} />, which is why action buttons
            use dark text. Orange text on white uses <code>action-text</code>, never the bright orange.
          </p>
        </Section>

        <Section
          id="type"
          title="Type"
          intro="Two fonts. Fredoka, rounded and friendly, for headings and big numbers only. Nunito Sans for everything people read. Six sizes; nothing in between."
        >
          <div className="grid gap-6 rounded-card border border-line bg-surface p-6">
            {TYPE.map(([size, extra, sample]) => (
              <div key={size} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                <code className="text-fine text-fg-muted">{size}</code>
                <p className={`${size} ${extra}`}>{sample}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-prose text-fine text-fg-muted">
            Weights: Fredoka 600 for headings (700 only in the wordmark); Nunito Sans 400 for text, 700 for emphasis
            and buttons. Body text stays at 16px or larger on phones.
          </p>
        </Section>

        <Section
          id="shape"
          title="Space and shape"
          intro="Everything sits on an 8px grid. One corner radius per size, so the app feels like one thing."
        >
          <div className="flex flex-wrap items-end gap-3">
            {[8, 16, 24, 32, 48, 64].map(px => (
              <div key={px} className="text-center">
                <div className="bg-highlight" style={{ width: px, height: px }} />
                <span className="mt-1 block text-fine text-fg-muted tabular-nums">{px}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['rounded-control', '8px', 'Buttons, inputs, chips'],
              ['rounded-card', '12px', 'Cards, popovers'],
              ['rounded-sheet', '16px', 'Modals, sheets, the yard scene'],
            ].map(([cls, px, use]) => (
              <div key={cls} className={`${cls} border border-line-strong bg-surface p-4 shadow-raised`}>
                <code className="font-semibold">{cls}</code>
                <p className="text-fine text-fg-muted">{px} · {use}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-fine text-fg-muted">
            Two shadows: <code>shadow-raised</code> for cards that sit on the page, <code>shadow-overlay</code> for
            things that float (menus, sheets). Borders do most of the work.
          </p>
        </Section>

        <Section
          id="components"
          title="Building blocks"
          intro="How the tokens combine. These are reference markup; the shared components get rebuilt on them during the redesign."
        >
          <div className="grid gap-6 rounded-card border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="h-11 rounded-control bg-action px-5 font-bold text-on-action hover:bg-action-hover focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                Book this display
              </button>
              <button type="button" className="h-11 rounded-control border border-line-strong bg-surface px-5 font-bold text-fg hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                Change date
              </button>
              <a href="#components" className="font-bold text-action-text underline underline-offset-4">See booking terms</a>
            </div>
            <label className="grid max-w-sm gap-1">
              <span className="text-fine font-semibold">Name on the display</span>
              <input defaultValue="Emma" className="h-12 rounded-control border border-line-strong bg-surface px-3 text-copy focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none" />
              <span className="text-fine text-fg-muted">Letters and numbers, up to 12.</span>
            </label>
            <div className="flex flex-wrap gap-2 text-fine font-semibold">
              <span className="rounded-control bg-positive-soft px-2 py-1 text-positive">Paid</span>
              <span className="rounded-control bg-caution-soft px-2 py-1 text-caution">Pickup tomorrow</span>
              <span className="rounded-control bg-danger-soft px-2 py-1 text-danger">Payment failed</span>
              <span className="rounded-control bg-notice-soft px-2 py-1 text-notice">Draft</span>
            </div>
            <p className="max-w-prose text-fine text-fg-muted">
              One orange button per screen: it is the thing we want people to do. Everything else is the outlined
              button or a link.
            </p>
          </div>
        </Section>

        <Section
          id="voice"
          title="Voice"
          intro={<>Plain, upbeat, short. We sound like a friendly neighbor who runs a tight operation: excited about the party, precise about the details.</>}
        >
          <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
            {[
              {
                who: 'To agencies (dashboard, emails, marketing)',
                tone: 'A capable business partner. Confident, direct, never salesy. Talks money and dates precisely.',
                do: ['3 displays go up this weekend.', 'Payment failed. We\'ll retry Thursday. Update the card to fix it now.', 'Set your prices to start taking bookings.'],
                dont: ['Oops! Something went wrong 😬', 'Supercharge your rental business!', 'Your webhook configuration is invalid.'],
              },
              {
                who: 'On booking pages (the agency\'s customers)',
                tone: 'Warm and celebratory, in the agency\'s name. Short steps, no jargon, every price shown before paying.',
                do: ['Who are we celebrating?', 'We set up the night before and pick up the day after.', 'Your total is $95. Nothing is charged until you confirm.'],
                dont: ['Enter recipient name (required)', 'Delivery logistics', 'Submit order'],
              },
            ].map(v => (
              <div key={v.who} className="rounded-card border border-line bg-surface p-6">
                <h3 className="font-display text-heading font-semibold">{v.who}</h3>
                <p className="mt-1 text-copy text-fg-muted">{v.tone}</p>
                <p className="mt-4 text-fine font-bold text-positive">Say</p>
                <ul className="mt-1 grid gap-1 text-copy">{v.do.map(s => <li key={s}>&ldquo;{s}&rdquo;</li>)}</ul>
                <p className="mt-4 text-fine font-bold text-danger">Not</p>
                <ul className="mt-1 grid gap-1 text-copy text-fg-muted">{v.dont.map(s => <li key={s}>&ldquo;{s}&rdquo;</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-card border border-line bg-surface p-6 text-copy">
            <h3 className="font-display text-heading font-semibold">Words</h3>
            <ul className="mt-2 grid gap-1">
              <li><strong>display</strong>, not order or install, for what the customer gets</li>
              <li><strong>booking</strong> for the customer&apos;s side; <strong>order</strong> only in the agency dashboard</li>
              <li><strong>setup</strong> and <strong>pickup</strong>, not delivery and removal</li>
              <li><strong>signs</strong> or <strong>letters</strong>, not cards or inventory items, when talking to customers</li>
              <li>Errors say what happened and what to do next. No apologies, no &ldquo;oops&rdquo;, no emoji.</li>
            </ul>
          </div>
        </Section>

        <Section
          id="white-label"
          title="White label"
          intro="On booking pages the agency is the brand. Agencies choose two colors and a logo; YardCard Elite fixes contrast and keeps the layout and wording, so every booking page stays easy to use."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {AGENCIES.map(a => {
              const accentKept = contrast(a.accent, a.brand) >= 3
              return (
                <div key={a.name} data-agency="" style={agencyThemeVars(a) as CSSProperties} className="overflow-hidden rounded-card border border-line bg-surface">
                  <div className="bg-brand px-5 py-4 text-on-brand">
                    <span className="block font-display text-heading font-semibold">{a.name}</span>
                    <span className="text-fine font-bold text-brand-accent">Step 2 of 4 · Pick your signs</span>
                  </div>
                  <div className="p-5">
                    <p className="text-fine text-fg-muted tabular-nums">
                      Brand {a.brand} · accent {a.accent}
                      {!accentKept && <> · accent too close to brand, so the band uses {readableOn(a.brand) === PALETTE.ink[0] ? 'white' : 'dark'} instead</>}
                    </p>
                    <button type="button" className="mt-4 h-11 w-full rounded-control bg-action font-bold text-on-action hover:bg-action-hover">
                      Book a display
                    </button>
                    <a href="#white-label" className="mt-3 inline-block font-bold text-action-text underline underline-offset-4">Booking terms</a>
                    <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-fine text-fg-muted">
                      Powered by <Logo variant="icon" className="h-4 w-4" title="" /> <span className="font-semibold">{BRAND.name}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-6 text-copy">
              <h3 className="font-display text-heading font-semibold">Agencies choose</h3>
              <ul className="mt-2 grid gap-1">
                <li><strong>Brand color</strong>: header and bands</li>
                <li><strong>Accent color</strong>: buttons and links. Optional; without it the brand color does both</li>
                <li>Their logo and business name in the header</li>
                <li>Their policy values (Elite): cancellation notice and fee, late fee, damage fee per sign. The terms text is generated from them</li>
              </ul>
            </div>
            <div className="rounded-card border border-line bg-surface p-6 text-copy">
              <h3 className="font-display text-heading font-semibold">Fixed by YardCard Elite</h3>
              <ul className="mt-2 grid gap-1">
                <li>Contrast: text on each color is picked automatically, and an accent that blends into the brand color is replaced on brand bands</li>
                <li>All wording: steps, buttons, messages and the generated terms</li>
                <li>Layout, fonts and the yard scene</li>
                <li>Status colors (paid, failed, cancelled)</li>
                <li>&ldquo;Powered by YardCard Elite&rdquo; in the footer, on every plan</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section
          id="motion"
          title="Motion"
          intro="One moment, done well: signs drop into the lawn, one letter after another, and settle with a little bounce. Everything else moves only to show a change. People who turn on reduced motion see the display appear without animation."
        >
          <DropDemo />
          <ul className="mt-6 grid gap-1 text-fine text-fg-muted tabular-nums">
            <li>Drop: 450ms per sign, 60ms between letters, slight overshoot</li>
            <li>Small changes (hover, open, close): 150 to 200ms</li>
            <li>Only changed letters drop again when someone edits the name</li>
          </ul>
        </Section>
      </main>
    </>
  )
}
