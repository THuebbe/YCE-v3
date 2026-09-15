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
- **Fixed 2026-09-14: Zone 3/4 fill gate no longer blocks ordinary
  checkout inputs.** Root cause was deeper than the 60%-vs-75% threshold
  mismatch: `calculateLayout()` derives zone3's available margin as
  `zone1.totalWidth - zone2.totalWidth`, clamped to 0 — so any message
  and recipient name of similar rendered width (e.g. "Happy Birthday" /
  "Test Recipient", both 13 chars) got zero room for decorations
  regardless of theme/hobbies, and fill computed to 0% (previously it
  could even be `0/0` → `NaN`), failing the gate. Rebuilt
  `calculateZone3AndZone4()` in `layout-calculator.ts` so each side of
  the display always gets a guaranteed minimum of 1 background sign +
  2 decoration signs — enough to look intentional even at 0 calculated
  margin — then grows by one more background + decoration at a time
  until the side covers 75% of its margin, accepting whatever the
  qualifying step overshoots to rather than trimming back. Also wired
  up real hobby-keyword weighting (decorations are now chosen by
  matching hobby text against a keyword-tagged pool, not by stamping the
  raw hobby string on screen as before); no hobbies falls back to the
  existing Character Theme random pick, unchanged. Verified two ways:
  first via a `tsx` script exercising `LayoutCalculatorService
  .calculateLayout()` directly, then confirmed live in the browser the
  same day — entered "Happy Birthday" / "Test Recipient" (no theme, no
  hobbies) on `/elite-denver/booking`, clicked Generate Layout, and got
  "Zone 3 fill: 100%", "Layout generated & signs reserved for 1 hour",
  and an enabled "Continue to Payment" button. Fully verified.
- **Fixed 2026-09-14: Event Details silently dead-ended for anyone who
  didn't touch the Event Date field.** The field defaulted to
  `Date.now() + 48h` captured once at component mount
  (`event-details-step.tsx`), but `eventSchema`'s Zod refine
  (`types.ts:19-26`) recomputes `now` fresh on every validation pass and
  requires `eventDate >= now + 48h` — so the untouched default failed the
  instant any wall-clock time elapsed after mount, not as an edge case
  but essentially always. Since `Continue` is `disabled={!isValid}`, the
  button just sat disabled forever with zero visible error (the handler
  that would populate `errors.eventDate` can't run behind a disabled
  button). Fixed by changing the default to `Date.now() + 72h` — real
  margin above the 48h minimum, long enough that no normal checkout
  session (minutes, and bounded by the 1-hour inventory hold anyway)
  can erode it back below the threshold; the actual 48h business-rule
  minimum (`min` attribute, Zod refine) is untouched. Verified live:
  filled Contact Info + Event Details (address only, date left
  completely untouched) via direct DOM/React state updates, waited 8
  seconds, and confirmed `Continue` was enabled (`disabled: false`) and
  advanced cleanly to Customize Display — no arrow-key nudge needed.
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
0. **Typing digits directly into the Event Date field can crash the
   whole Event Details step.** Automating keystrokes into the native
   `<input type=date>` (e.g. typing `09202026` digit by digit) can leave
   it in a momentarily invalid state; `formatDateForInput()` then calls
   `date.toISOString()` on an Invalid Date and throws `RangeError:
   Invalid time value`. A React error boundary catches it ("Something
   went wrong" / dev error panel), but the step's local state (address,
   etc.) is lost and has to be re-entered. Found 2026-09-14 alongside the
   date-staleness bug below (now fixed) — this one is separate and still
   open. Real users clicking the native calendar picker likely never hit
   this (it can't emit an invalid intermediate value); risk is mainly
   users who type the date manually, or any other automated testing.
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
7. **`sign_library` has no letters** — all pre-made message boards plus
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
`sign-selection.ts` is a weighted-search engine for Zone 3/4 decorations
from Hobbies/Theme — still unfinished, still not called from anywhere,
still not what runs today. As of the 2026-09-14 fill-gate fix (see
VERIFIED WORKING), what runs today is a separate, self-contained
keyword-weighting implementation inside `layout-calculator.ts` itself
(`decorationCatalog`/`rankDecorationsByHobbies`), not `sign-selection.ts`.
The "DE DE DE" raw-hobby-string bug this note originally described is
gone as a side effect of that fix. `sign-selection.ts` remains dead code
— still a candidate for deletion or for replacing the new inline
implementation later, not decided.

**Product direction (decided):** ship the Lettered Message configurator
first (already works); Single Stake (pre-made signs, no letters) comes
after the demo, needs `pricing_config.singleStakePrice`. `bundles` is an
inventory-purchasing concept for agencies, not a customer product.

## Next steps, in order
1. ~~Apply the three migrations~~ / ~~re-test payment end-to-end~~ — both
   done, payment step confirmed rendering (found and fixed a second
   PayPal casing bug along the way).
2. ~~Fix the Zone 3 fill gate~~ — done 2026-09-14, confirmed live in the
   browser (threshold + root cause, see VERIFIED WORKING).
2a. ~~Fix the Event Details date-staleness bug~~ — done 2026-09-14,
   confirmed live in the browser (see VERIFIED WORKING). The separate
   typing-crash bug (VERIFIED BROKEN #0) is still open, not started.
3. Move holds server-side onto the real `inventory_holds` tables.
4. Seed letters into `sign_library`, then connect `getAvailableSigns()` to
   real inventory.
5. Fix the renderer (per-asset width, baseline alignment via sign-assets
   resolver), install the PNG set.
6. Vendor conversation, demo in hand.

## Reference docs
- `PRODUCT.md` (repo root) — business rules, authoritative for WHY.
- Archived `technical-architecture.md`/`project-guide.md`/
  `Enhanced-TDD-Protocol.md` (workspace level) contain stale Prisma-era
  info ~9 months behind reality. **Do not implement from them.**

## RESOLVED — spec vs code
Zone 3 fill requirement: spec said 75%, `layout-calculator.ts` used `0.6`.
Fixed 2026-09-14 — both thresholds now use `0.75`, matching the docstrings
that already said 75%. The deeper root cause (0% fill for same-length
message/name pairs, independent of the threshold) was fixed the same day
too — see VERIFIED WORKING.

## NOT VERIFIED — needs investigation
- **Possible duplicate step rendering in dev.** While browser-testing the
  Zone 3/4 fix 2026-09-14, the accessibility tree repeatedly showed two
  full copies of the current step's heading/form/Continue button stacked
  in the DOM (e.g. two "Event Details" headings, two Continue buttons at
  different `disabled` states) — not visible to the eye in screenshots
  (they overlap), only via `read_page`/DOM queries. Console also showed
  100+ duplicate "Component rendering" logs for `contact-info-step.tsx`
  within about one second of initial mount. Root cause not identified —
  candidates are a framer-motion `AnimatePresence` exit-animation leak
  (steps use `motion.div` with enter/exit transitions) or a `next dev`
  double-render artifact; didn't confirm which, or whether it happens in
  a production build. Worked around by always querying the DOM directly
  for `disabled` state rather than trusting a single accessibility-tree
  snapshot or a single click. Not related to the Zone 3/4 fix (reproduces
  as early as step 1, before that code path runs) — separate bug, unfixed.

## NOT VERIFIED — check before trusting
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed, but its password was silently
  reset — Clerk flagged the old shared `TestPass123!` as compromised.
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
