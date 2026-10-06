# Where This Stands

**2026-10-06: production deploys fine but serves 404 — Supabase is
paused again.** PR #3 (Next.js 15.3.4 → 15.3.9, the CVE deploy block)
merged 2026-09-19; `main` deployments are `READY` on Vercel through
`0af5f32` (checked via the Vercel API). But
`/elite-denver/booking` on production returned 404 on 2026-10-06: the
route matched (`x-matched-path: /[agency]/booking/[[...path]]`), the
agency lookup came back empty, and all four Supabase projects in the org
(incl. `YCEv3`, `uwgrpcuqakuxulgnbcpd`) report `INACTIVE`. Claude's
attempt to restore it was blocked by a permission guardrail — **a human
must hit Restore in the Supabase dashboard.** Second time this has
taken the app down (first: restored 2026-09-10); free tier re-pauses
after ~7 days idle.

**Unmerged work:** branch `claude/vercel-host-and-pricing` (commit
`e376b55`) — per-agency pricing + real agency ID in the wizard, and the
`.vercel.app` hostname fix. Type-checked and linted, NOT seen running
(DB paused). See NOT VERIFIED.

Last verified live-in-browser: 2026-09-14 (booking wizard Contact Info →
Payment; dashboard login). Nothing since has been browser-verified by a
Claude session.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** Ordinal insertion works.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.
- **Fixed 2026-09-14: dashboard login for manually-seeded users** —
  `getUserById()` now also matches `clerk_user_id`. Confirmed live.
- **Payment step works, clicked through** (after
  `migrations/20260912_rename_paypal_columns_to_snake_case.sql`).
- **Fixed 2026-09-18, merged 2026-09-19 (PR #3): the Vercel deploy
  block.** Not a code error — `next build` always succeeded; Vercel
  refused to deploy `next@15.3.4` (`VULNERABLE_NEXTJS_VERSION`,
  CVE-2025-66478), so production was down from `dc1c4c8` until the
  merge. Bumped `next`/`eslint-config-next` to `15.3.9` (same 15.3.x
  line). Production deployments of `4cf60ac` and `0af5f32` are `READY`.
  Vercel bot PRs #1 and #2 (bumps to 15.3.8) are superseded — close them.
- **Fixed 2026-09-14: Zone 3/4 fill gate** — zone3 margin hit 0 for
  similar-length message/name. Each side now gets a guaranteed minimum
  (1 background + 2 decorations), then grows to 75%. Verified live.
- **Fixed 2026-09-14: Event Details dead-end** — default date now
  `+72h` (48h rule re-checked live). Verified live. Pick 3+ days out
  when testing manually.
- **Fixed 2026-09-16 (`742320c`): real letter PNGs render in Zone 1/2**
  via `public/sign-assets/manifest.json`; `getAvailableSigns()` reads the
  same manifest through an injectable `SignSource` (swap the default for
  real inventory later). Verified via dev server + script.
- **Fixed 2026-09-16 (`e41f821`): Zone 3 renders real heart/star art**;
  ranking no longer drops zero-score candidates. Other decorations are
  still colored circles (no art). Smart-configurator design that grew
  out of this: `ARCHITECTURE.md` (DESIGNED, NOT BUILT).
- **Dead end:** a `/routing` ↔ `/auth/sign-in` redirect loop was dev
  machine clock skew (Clerk token `nbf` "not valid yet"), not code.

## VERIFIED BROKEN
0. **Production 404s — Supabase project paused** (see top). Fix: Restore
   in the Supabase dashboard. Longer term: a keep-alive ping or a paid
   tier, or this recurs every ~7 idle days.
1. **Inventory holds are `localStorage`**, not the real `inventory_holds`
   tables the agency side already uses. Two customers can reserve the
   same letters; holds die on device switch; the cron cleanup can't run.
2. **Subdomain URLs 404 in dev**; middleware detects the subdomain but
   never rewrites the path. Use path-based URLs (`/elite-denver/booking`).
3. ~~`.vercel.app` breaks deploys~~ — **overstated; fixed on branch.**
   Re-read 2026-10-06: `getSubdomain` did misread the deploy hostname as
   a slug, but it only set a bogus `x-subdomain` header and caused one
   wasted agency lookup on non-dashboard routes. Booking resolves the
   agency from route params, dashboard routes from the path first —
   neither was broken by it. `.vercel.app` now returns null (`e376b55`).
4. **`getAvailableSigns()` is manifest-backed, not Supabase-backed.**
   Fixed 2026-09-16 to read real PNG assets via `manifestSignSource`
   instead of pure mock data — but still not real per-agency inventory:
   every agency gets the same 315 assets, same fake `availableQuantity:
   99`. Supabase import still commented out.
5. **`layout-calculator.ts` never consults real inventory** — asset
   *lookup* (which PNG) is wired now, but ownership/quantity per agency
   isn't, so it can still promise letters an agency doesn't own or
   doesn't have enough of.
6. **Order totals are trusted from the client.** `/api/orders/create`
   stores whatever `totalAmount` the browser sends, and the payment step
   charges the client-computed total. Anyone can edit the price. Fix:
   recompute from `pricing_config` server-side. (The wizard *display*
   price itself is fixed on branch — see NOT VERIFIED.)
7. **`sign_library` has no letters** — pre-made message boards + unrelated
   real-estate seed data only, `rental_price` 0 everywhere.
   `agency_inventory` populated for elite-denver, not for letters. This
   is now the specific blocker for the ARCHITECTURE.md configurator
   design, not just a nice-to-have — see that doc for what schema/seed
   decisions are needed first.

## Known, deliberately deferred
- RLS off on all YCE tables — before first paying agency, not before demo.
- PantryPro's `pos_*`/`inventory_deductions` tables have RLS on with no
  working policies (key off `auth.uid()`, null under Clerk) — locked, but
  didn't cause the YCE stall.
- **DECISION: split the shared DB into two Supabase projects, normalize
  casing — TRIGGER: first paying agency, or PantryPro resuming.** Not
  now: 45-table migration, two-codebase rewrite, a breakage window.
- Custom domain expired; `.vercel.app` still serves.
- 305 `console.log`, 72 `any`, 3 test files across 33.6k LOC.
- No `.env.example`. No baseline schema migration committed.
- Single Stake package tier designed, never built; `bundles` +
  `bundle-creator.tsx` exist agency-side only.
- `sign-selection.ts` — unused weighted-search engine for Zone 3/4,
  predates and was superseded by the keyword-ranking now live in
  `layout-calculator.ts`. Candidate for deletion.

**Product direction (decided):** ship the Lettered Message configurator
first (already works); Single Stake (pre-made signs, no letters) comes
after the demo, needs `pricing_config.singleStakePrice`. `bundles` is an
inventory-purchasing concept for agencies, not a customer product.

## Next steps, in order
0. **Restore the Supabase project** (dashboard, `YCEv3`). Then confirm
   `/elite-denver/booking` loads on production.
1. **Merge `claude/vercel-host-and-pricing`** after clicking through the
   wizard on its Vercel preview — check the NOT VERIFIED items below.
   Close PRs #1/#2.
2. Recompute order totals server-side (VERIFIED BROKEN #6).
3. Move holds server-side onto the real `inventory_holds` tables.
4. **Seed letters into `sign_library`, connect `getAvailableSigns()` to
   real per-agency inventory** — the defined blocker for the smart
   configurator (`ARCHITECTURE.md`). Needs schema + per-agency seed data
   + message→theme taxonomy decided first, not just code.
5. Vendor conversation, demo in hand.

## Reference docs
- `PRODUCT.md` — business rules, authoritative for WHY.
- `ARCHITECTURE.md` — how the pieces fit together, including the
  DESIGNED-NOT-BUILT smart configurator spec.
- Archived `technical-architecture.md`/`project-guide.md`/
  `Enhanced-TDD-Protocol.md` (workspace level) are ~9 months stale,
  Prisma-era. **Do not implement from them.**

## NOT VERIFIED — needs investigation
- **Possible duplicate step rendering in dev** — two stacked copies of
  the current step in the DOM, 100+ duplicate render logs. Suspects:
  `AnimatePresence` exit leak or `next dev` double-render. Workaround:
  query the DOM for `disabled` state rather than trusting one snapshot.

## NOT VERIFIED — check before trusting
- **Per-agency pricing in the wizard (branch, `e376b55`).** Booking page
  reads `pricing_config` server-side → wizard context →
  `calculateBookingTotal()` (`features/booking/pricing.ts`), replacing
  four $95/$10 copies. Also removes hardcoded
  `agencyId: 'yardcard-elite-west-branch'` (a slug!) from order creation,
  layout generation and soft holds. Check: book on two
  agencies with different prices; totals should differ and the new
  `orders.agency_id` should be the real cuid. No valid `basePrice` →
  "not taking online bookings" message; missing `extraDayPrice` → 0
  (a guess — confirm every agency has it set).
- **Sep 19 commits made outside a Claude wrapup** — `4cf60ac` (letters
  touch, recipient name re-centered, separate Message/Name color
  pickers) and `0af5f32` (Event Date typing crash; was VERIFIED BROKEN
  #0). Read in diff, not seen running.
- Review step's layout preview calls `calculateLayout` without
  style/colorways, so it likely renders default red, not the customer's
  picks. Seen in code only.
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed; its password was silently reset
  (Clerk flagged the old shared `TestPass123!` as compromised).
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
