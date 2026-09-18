# Where This Stands

**2026-09-18: production has been down since commit `dc1c4c8`** (several
sessions back) — every deploy since then, including ones that claimed to
"fix the Vercel build," actually failed on a *different*, later problem:
Vercel's platform blocking deploys of `next@15.3.4` as a known CVE
(`VULNERABLE_NEXTJS_VERSION`, CVE-2025-66478) — confirmed via the Vercel
API against both `main`'s and this branch's latest deployments, same
error on both. The build itself always succeeded; this was a
platform-level security gate, not a code bug. Fixed by bumping to
`15.3.9` (same 15.3.x line, smallest possible patch) — verified via a
real Vercel deployment reaching `READY`. **Sitting in PR #3
(THuebbe/YCE-v3), not yet merged** — pushing directly to `main` is
blocked by a safety guardrail requiring a persistent permission rule, not
just in-chat authorization, so this needs a human to merge the PR (or hit
Vercel's "Promote to Production" on the already-`READY` deployment) to
actually bring the site back up. See VERIFIED WORKING for detail.

Last verified live-in-browser: 2026-09-14 (booking wizard Contact Info →
Payment; dashboard login). 2026-09-16 session wired real PNGs into the
configurator and verified via dev-server + script (this container has no
Supabase credentials, so full-page browser verification wasn't possible
here — see VERIFIED WORKING). Supabase project was PAUSED; restored
2026-09-10. Free tier re-pauses after ~7 days idle.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** Ordinal insertion works.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.
- **Fixed 2026-09-14: dashboard login never worked for manually-seeded
  users** — `getUserById()` only matched Clerk-webhook-created users, not
  seeded ones (cuid `id`, Clerk id in `clerk_user_id`, never queried).
  Fixed with `.or('id.eq.<id>,clerk_user_id.eq.<id>')`. Confirmed live.
- **Payment step works, clicked through.** 2026-09-12 PayPal migration
  added camelCase columns against snake_case app code (same shape as the
  original braintree bug). Fixed via
  `migrations/20260912_rename_paypal_columns_to_snake_case.sql`.
- **Fixed 2026-09-18 (PR #3, not yet merged): found and fixed the real
  reason every Vercel deploy has failed since `dc1c4c8`.** Not a code
  error — `next build` always succeeded (compiles, type-checks, all 27
  routes generate). Vercel's platform was blocking deployment of the
  *output* because `next@15.3.4` is flagged `VULNERABLE_NEXTJS_VERSION`
  (CVE-2025-66478); confirmed via the Vercel API on both `main`'s and
  this branch's latest deployments — same error on both, so this has
  been a production outage the whole time, not just broken previews.
  Bumped `next`/`eslint-config-next` to `15.3.9` (smallest possible
  patch, same 15.3.x line). Verified by pushing and watching a real
  Vercel deployment (`dpl_51BrypW27jMgrkekyBwtJFWUimCj`) reach `READY`.
  Merging PR #3 (or promoting that deployment to production in the
  Vercel dashboard) is the one remaining step — a git push to `main` is
  blocked here by a safety guardrail that needs a persistent permission
  rule, not just chat authorization.
- **Fixed 2026-09-14: Zone 3/4 fill gate blocked ordinary checkout
  inputs.** Real bug: zone3's margin (`zone1.totalWidth -
  zone2.totalWidth`) hit 0 whenever message/name were similar lengths →
  0% fill, gate never passed. Rebuilt `calculateZone3AndZone4()`: each
  side gets a guaranteed minimum (1 background + 2 decorations), then
  grows to 75%, overshoot accepted. Decorations now use real
  hobby-keyword matching. Verified live: "Happy Birthday"/"Test
  Recipient" now reaches "Zone 3 fill: 100%" and enabled Continue.
- **Fixed 2026-09-14: Event Details silently dead-ended** if the Event
  Date field was left untouched — default was `+48h` from mount, but
  validation re-checks "48h from now" live, failing almost immediately
  with `Continue` disabled and no visible error. Fixed by defaulting to
  `+72h` (real margin above the unchanged 48h business rule). Verified
  live: date left untouched, Continue enabled after 8s, advanced cleanly.
  Minor residual: date-only field can reject a date exactly 2 calendar
  days out before midnight — pick 3+ days when testing manually.
- **Fixed 2026-09-16 (`742320c`): real letter/number/punctuation PNGs
  render in Zone 1/2**, not colored boxes. `layout-calculator.ts`
  resolves each character against `public/sign-assets/manifest.json` for
  the chosen style/colorway; `getAvailableSigns()` (`inventory.ts`) now
  reads the same manifest via an injectable `SignSource` (default
  `manifestSignSource`) instead of pure hardcoded mock letters — swapping
  in real per-agency inventory later is a one-line default change, not a
  rewrite. New colorway picker + manifest-driven Style radio (currently
  one real option, "Classic") replaced the old hardcoded/mismatched list.
- **Fixed 2026-09-16 (`e41f821`): Zone 3 renders real heart/star art**
  when decoration selection picks them. `rankDecorationsByHobbies` no
  longer drops zero-score candidates — a hobby matching only art-less
  decorations (or nothing) still leaves every candidate reachable instead
  of excluded. Verified: a 26-slot forced layout cycled through all 13
  catalog entries, rendering real art on the Stars/Heart picks.
  Everything else (Baseball, Crown, ...) still renders as a colored
  circle — no art exists for it. Design discussion this led into (a
  full Theme/Style/Color/Hobby "smart configurator") is documented in
  `ARCHITECTURE.md` (`Smart configurator ... — DESIGNED, NOT BUILT`); DB
  work (sign_library schema for letters, per-agency inventory seed,
  message→theme taxonomy, scoring formula) is the explicit blocker.
- **Dead end, recorded so it isn't repeated:** a `/routing` ↔
  `/auth/sign-in` redirect loop while testing the login fix was a dev
  machine clock skew (~45-60s behind), not a code bug — every fresh
  Clerk session token's `nbf` looked "not valid yet" forever. Fixed by
  resyncing the OS clock; nothing in the repo changed.

## VERIFIED BROKEN
0. **Typing digits directly into the Event Date field can crash the
   Event Details step** — an intermediate invalid `<input type=date>`
   value makes `formatDateForInput()` throw on `.toISOString()`, caught
   by an error boundary but losing step state. Calendar-picker use can't
   trigger it; risk is manual typing only. Still open, low priority.
1. **Inventory holds are `localStorage`**, not the real `inventory_holds`
   tables the agency side already uses. Two customers can reserve the
   same letters; holds die on device switch; the cron cleanup can't run.
2. **Subdomain URLs 404 in dev**; middleware detects the subdomain but
   never rewrites the path. Use path-based URLs (`/elite-denver/booking`).
3. **Every `.vercel.app` deploy breaks the same way** — `getSubdomain`
   misreads the deploy hostname as an agency slug. Needs an early
   `if (host.endsWith('.vercel.app')) return null`.
4. **`getAvailableSigns()` is manifest-backed, not Supabase-backed.**
   Fixed 2026-09-16 to read real PNG assets via `manifestSignSource`
   instead of pure mock data — but still not real per-agency inventory:
   every agency gets the same 315 assets, same fake `availableQuantity:
   99`. Supabase import still commented out.
5. **`layout-calculator.ts` never consults real inventory** — asset
   *lookup* (which PNG) is wired now, but ownership/quantity per agency
   isn't, so it can still promise letters an agency doesn't own or
   doesn't have enough of.
6. **Wizard ignores per-agency pricing.** `basePrice = 95` hardcoded in
   four step components despite `agencies.pricing_config` existing and
   being correct (six agencies charge $81-$111).
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
0. **Merge PR #3 (or promote its verified Vercel deployment to
   production)** — this is the only thing standing between the app and
   working again. Everything else below assumes production is reachable.
1. ~~Migrations / payment retest / Zone 3 fill gate / Event Details
   date-staleness / render real PNGs~~ — all done, see VERIFIED WORKING.
2. Fix the typing-crash bug on Event Date (VERIFIED BROKEN #0) — low
   priority.
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
- **Possible duplicate step rendering in dev.** Accessibility tree
  showed two full copies of the current step stacked in the DOM
  (invisible on screen, overlapping) plus 100+ duplicate render logs for
  `contact-info-step.tsx` near mount. Candidates: framer-motion
  `AnimatePresence` exit leak, or `next dev` double-render. Unconfirmed
  which, or whether it happens in production. Workaround: query the DOM
  directly for `disabled` state rather than trusting one snapshot.

## NOT VERIFIED — check before trusting
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed; its password was silently reset
  (Clerk flagged the old shared `TestPass123!` as compromised).
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
