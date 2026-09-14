# Where This Stands

Last verified: 2026-09-14. Booking wizard clicked through live end to end
(Contact Info → fully-rendered Payment step) and authenticated dashboard
login clicked through live for the first time this dormancy —
admin@elite-denver.com signed in via Clerk and reached the real dashboard.
Supabase project was PAUSED; restored 2026-09-10. Free tier re-pauses
after ~7 days idle.
Vercel deployments were failing on real TypeScript compile errors — fixed
2026-09-14, see VERIFIED WORKING.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** "HAPPY 33RD BIRTHDAY" over
  "BRANDON" with flanking decorations and bookends, rendered in the
  preview box over the lawn photo. Ordinal insertion works. Zone 3 fill
  reported 69%. This is the part that was believed broken. It isn't.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.
- **Fixed 2026-09-14: dashboard login never worked for manually-seeded
  users.** `getUserById()` matched `users.id` against the Clerk auth ID,
  which only lines up for users created via the live signup webhook
  (`api/webhooks/clerk/route.ts` inserts `id = <clerk id>`). Seeded users
  (`scripts/sync-clerk-users.ts`) keep a cuid `id` and store the Clerk id
  in `clerk_user_id` instead — a column never queried. Broken since Prisma
  was removed, not a new regression. Fixed with
  `.or('id.eq.<id>,clerk_user_id.eq.<id>')` in the one function 18 files
  depend on. Confirmed with a real Clerk sign-in reaching the dashboard.
- **Payment step works — clicked through, not just schema-checked.** The
  2026-09-12 migrations missed one thing: the PayPal migration added
  columns in camelCase while every app file reading them uses snake_case
  — same failure as the original braintree bug, different column. Fixed
  2026-09-14 via `migrations/20260912_rename_paypal_columns_to_snake_case.sql`
  (rename, run by hand in Supabase SQL editor; no app code changed).
  Payment Information now renders the card form and order summary with no
  error. `agencies` has no relation to PantryPro's tables, so zero shared
  blast radius.
- Minor: the event-date field is date-only (no time), so "48 hours from
  now" can reject a date exactly 2 calendar days out before midnight.
  Pick 3+ days out when testing manually.
- **Dead end, recorded so it isn't repeated:** a `/routing` ↔ `/auth/sign-in`
  redirect loop hit while testing the login fix was NOT a code bug — the
  dev machine's clock was ~45-60s behind real time, so every fresh Clerk
  session token's `nbf` claim looked "not valid yet" to the server's local
  JWT check, forever (confirmed via HAR: `x-clerk-auth-reason:
  session-token-nbf`). Fixed by resyncing the OS clock; nothing in the repo
  changed. `/routing`'s auto-redirect is a known-flaky `setTimeout` hack
  (already TODO'd in that file) and still needed a manual fallback click
  even post-fix — pre-existing, not caused by this.
  `NEXT_PUBLIC_CLERK_DOMAIN` in `.env.local` was commented out as a
  diagnostic step before the clock was identified; never confirmed to
  matter either way, local-only, zero risk, not urgent to revisit.

## VERIFIED BROKEN
1. **Inventory holds are `localStorage`**, not the real `inventory_holds`
   tables the agency side already uses (`features/inventory/actions.ts`).
   Two customers can reserve the same letters; holds die on device switch;
   `api/cron/clear-expired-holds` can't run (no `localStorage` server-side).
2. **Subdomain URLs 404 in dev**; middleware detects the subdomain but
   never rewrites the path. Use path-based URLs (`/elite-denver/booking`).
3. **Every `.vercel.app` deploy breaks the same way** — `getSubdomain`
   misreads the deploy hostname as an agency slug. Needs an early
   `if (host.endsWith('.vercel.app')) return null`.
4. **`getAvailableSigns()` returns hardcoded mock data**; its Supabase
   import is commented out.
5. **`layout-calculator.ts` never consults inventory** — can promise
   letters the agency doesn't own.
6. **Wizard ignores per-agency pricing.** `basePrice = 95` hardcoded in
   four step components despite `agencies.pricing_config` existing and
   being correct (six agencies charge $81-$111). Fix: fetch on wizard
   load like payment-methods, read from context.
7. **Zone 3's 60% fill minimum blocks checkout for ordinary inputs — not
   cosmetic.** "Happy Birthday"/"Test Recipient" gets 0% fill, no hold
   gets created, "Continue to Payment" never enables, no error shown.
   Only cleared it with the exact known-good example (age 33 / "Brandon").
   Likely blocking most real customers today.
8. **`sign_library` has no letters** — all pre-made message boards plus
   unrelated real-estate seed data, `rental_price` 0 everywhere.
   `agency_inventory` is populated correctly for elite-denver, just not
   for letters. Seed from the sign-assets manifest before wiring
   `getAvailableSigns()` to real inventory.

## Placeholder assets — generated, ready to install
315 transparent PNGs (A-Z, 0-9, punctuation, heart, star × 7 colorways),
OFL/Apache fonts, nothing derived from vendor imagery. `manifest.json`
carries `widthIn`/`heightIn`/`baselineYPct`. Install at `public/sign-assets/`
(generator stays in `tools/sign-generator/`). Resolver written:
`src/features/booking/services/sign-assets.ts`. The 4 font styles map
directly to the existing Message/Name Style radios.

## Dead code — removed 2026-09-12
`src/temp-inventory/`, `src/app/booking-site/` (repointed its two live
dashboard links to `/${agencySlug}/booking` and `/settings` first),
`src/app/debug*`/`test-db/`, `makeAgencyIdNullable()`, two Prisma-era
scripts, `vercel.json`'s Prisma config, and the stray
`@anthropic-ai/claude-code` prod dependency. All gone.
**Not done, needs a decision:** the `exec_sql` Postgres RPC (arbitrary
raw-SQL execution) `makeAgencyIdNullable()` called still exists live,
still referenced by 3 now-obsolete migration scripts. Dropping a DB
function on infra shared with PantryPro is irreversible — flagged, not
touched.

## Known, deliberately deferred
- RLS off on all YCE tables — before first paying agency, not before demo.
- PantryPro's `pos_sales`/`pos_sales_items`/`pos_import_history`/
  `inventory_deductions` have RLS on with no working policies (key off
  `auth.uid()`, null under Clerk) — effectively locked. Didn't cause the
  YCE stall.
- **DECISION: split the shared DB into two Supabase projects, normalize
  casing — TRIGGER: first paying agency, or PantryPro resuming, whichever
  first.** Not now: 45-table migration, rewrites in two codebases, a
  breakage window. Shared schema hasn't broken anything on the path to demo.
- Custom domain expired; `.vercel.app` still serves.
- 305 `console.log`, 72 `any`, 3 test files across 33.6k LOC.
- No `.env.example`. No baseline schema migration committed.
- Single Stake package tier designed, never built; `bundles` +
  `bundle-creator.tsx` exist agency-side only. `isBundle`/`bundleContents`
  unused on the booking Sign type.

## RESOLVED — this was never a fork
`sign-selection.ts` is the intended weighted-search engine for Zone 3/4
decorations from Hobbies/Theme — unfinished, not a competing model,
nothing calls it yet. What runs today: `calculateZone3` emits the raw
hobby string as a label, `getThemeDecoration()` picks randomly from a
hardcoded array. That's the "DE DE DE" on screen.

**Product direction (decided):** ship the Lettered Message configurator
first (already works); Single Stake (pre-made signs, no letters) comes
after the demo, needs `pricing_config.singleStakePrice`. `bundles` is an
inventory-purchasing concept for agencies, not a customer product.

## Next steps, in order
1. ~~Apply the three migrations~~ / ~~re-test payment end-to-end~~ — both
   done, payment step confirmed rendering (found and fixed a second
   PayPal casing bug along the way).
2. **Fix the Zone 3 60% fill gate** (VERIFIED BROKEN #7) — bigger blocker
   to a usable demo than the holds issue below, since it stops customers
   before payment.
3. Move holds server-side onto the real `inventory_holds` tables.
4. Seed letters into `sign_library`, then connect `getAvailableSigns()` to
   real inventory.
5. Fix the renderer (per-asset width, baseline alignment via sign-assets
   resolver), install the PNG set.
6. Resolve the design fork above.
7. Vendor conversation, demo in hand.

## Reference docs
- `PRODUCT.md` (repo root) — business rules, authoritative for WHY.
- Archived `technical-architecture.md`/`project-guide.md`/
  `Enhanced-TDD-Protocol.md` (workspace level) contain stale Prisma-era
  info ~9 months behind reality. **Do not implement from them.**

## OPEN QUESTION — spec vs code
Zone 3 fill requirement: spec says 75%, `layout-calculator.ts` uses `0.6`
(its own docstring says 75%). Pick one.

## NOT VERIFIED — check before trusting
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed, but its password was silently
  reset — Clerk flagged the old shared `TestPass123!` as compromised.
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
