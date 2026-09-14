# Where This Stands

Last verified: 2026-09-14. The booking wizard was clicked through live,
end to end, from Contact Information through a fully-rendered Payment
Information step (card fields, order summary, no error banner) — this
is the first time that's been confirmed since the 2025-09-06 dormancy,
not just schema-checked. Same day: authenticated login was clicked
through live too, for the first time this dormancy — admin@elite-denver.com
signed in via Clerk and reached the real agency dashboard.
Supabase project was PAUSED; restored 2026-09-10. Free tier re-pauses
after ~7 days idle.
**Vercel deployments were failing — fixed 2026-09-14.** `next build`
(same command Vercel runs) was failing at the type-check stage on four
unrelated camelCase-vs-snake_case mismatches between local TS interfaces
and the real Supabase data shape, in `DashboardOverview.tsx`,
`payment-step.tsx`, `custom-sign-upload-form.tsx`, and
`my-inventory-list.tsx`. Not a Node 23 or dependency issue — a genuine,
deterministic compile error, reproduced locally with a full `pnpm build`
(27/27 routes). Fixed and pushed; Vercel should build clean on the next
deploy from `main` — not yet confirmed against the actual Vercel dashboard
since this session has no Vercel API/CLI access.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** "HAPPY 33RD BIRTHDAY" over
  "BRANDON" with flanking decorations and bookends, rendered in the
  preview box over the lawn photo. Ordinal insertion works. Zone 3 fill
  reported 69%. This is the part that was believed broken. It isn't.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.
- **Fixed 2026-09-14: authenticated dashboard login never worked for any
  manually-seeded user (only for users created through the live Clerk
  signup webhook).** `getUserById()` looked up `users` by `.eq('id',
  userId)`, where `userId` is the Clerk auth ID. That only matches because
  `api/webhooks/clerk/route.ts` happens to insert new users with
  `id = <clerk id>` directly. Users seeded another way (e.g.
  `scripts/sync-clerk-users.ts`) keep their original cuid `id` and store
  the Clerk id separately in `clerk_user_id` — a column `getUserById` never
  queried. Confirmed live: `admin@elite-denver.com` has
  `id: cmcpq8c3y0001q800gn59kfio` but `clerk_user_id:
  user_2zRKzusknd0Eko93RaAnYaNm72E`; signing in returned the Clerk id, the
  lookup missed, and `/routing` fell through its "user not found" branch to
  `/onboarding` instead of the dashboard. This has been broken since Prisma
  was removed (`git log`: introduced in "Nuclear option: Replace Prisma
  with direct Supabase queries"), so it predates this dormancy — not a
  regression from anything done this week. Fixed by matching
  `.or('id.eq.<id>,clerk_user_id.eq.<id>')`; this one function is called
  from 18 files (every `[agency]/*` page, most `api/agency/*` routes,
  `api/dashboard`, `/routing`), so the fix applies everywhere at once.
  Verified the corrected query resolves admin@elite-denver.com to its
  agency, AND confirmed 2026-09-14 by actually signing in through Clerk in
  a browser and landing on the real dashboard — first confirmed real login
  since the dormancy.
- **The /routing → sign-in loop that showed up while testing the above was
  not a code bug — it was the dev machine's system clock running ~45-60s
  behind real time**, confirmed via a HAR capture: every fresh Clerk
  session token carried an `nbf` (not-before) claim pinned to Clerk's
  (correct) clock, which the Next.js server's local JWT verification
  always saw as "not valid yet" against the skewed local clock, so
  `auth()` kept reporting signed-out and the client kept retrying,
  self-sustaining the loop indefinitely. Fixed by resyncing Windows' clock
  (Settings → Date & Time → Sync now). Nothing in the repo needed to
  change for this one. Residual rough edge, not new: `/routing`'s
  auto-redirect (a raw `<script>` with staggered `setTimeout` +
  `window.location.replace`, see the TODO already in that file) didn't
  fire reliably even post-fix and needed a manual click on its fallback
  link — this is the file's own documented workaround for "Next.js dev
  server Fast Refresh interference," not something this session introduced.
  Worth replacing with a real client-side redirect at some point, but low
  priority.
- **Open, unresolved from this session:** while chasing the above,
  `NEXT_PUBLIC_CLERK_DOMAIN=localhost:3000` was commented out in
  `.env.local` as a diagnostic step (Clerk's SDK auto-reads it as a
  `domain` default with no satellite/proxy wiring elsewhere in the app to
  support it). The clock turned out to be the actual cause, so this env
  var was never confirmed to matter either way — it's currently disabled
  and everything works, but nobody's tested restoring it. Local-only
  (`.env.local` is gitignored), zero risk either way; revisit if curious,
  not urgent.
- **Payment step actually works now — clicked through, not just schema-checked.**
  The 2026-09-12 migrations fixed two of the three payment-blocking columns
  (Braintree/Venmo, orders booking columns) but missed one: the PayPal
  migration added its 11 columns in camelCase (`paypalAccountId`, ...) while
  every app file that reads them (`paypal-actions.ts`, the PayPal webhook,
  `payment-methods/route.ts`) uses snake_case (`paypal_account_id`, ...) —
  same failure mode, different column, still a 500. Fixed 2026-09-14 with
  `migrations/20260912_rename_paypal_columns_to_snake_case.sql` (a rename,
  applied by hand in the Supabase SQL editor per the rule above; no app code
  changed). Re-walked the wizard afterward: Payment Information now renders
  the card form and order summary with no error. `agencies` has no
  relationship to PantryPro's `businesses`/`restaurants` tables (only
  `users.business_id` bridges that), so this had zero shared-DB blast radius.
- Minor, not yet fixed: the event-date field only carries a date, no time,
  so "must be 48 hours from now" can reject a date exactly 2 calendar days
  out if it's not yet midnight on the start day. Pick 3+ days out when
  testing manually.

## VERIFIED BROKEN
1. **Inventory holds are `localStorage`.** The UI says so out loud:
   "Using mock inventory hold for testing." Real `inventory_holds` /
   `inventory_hold_items` tables exist and are used by the AGENCY side
   (`features/inventory/actions.ts`). The booking side never got wired.
   Consequences: two customers can reserve the same physical letters;
   holds die on device switch; the `holdId` gating payment is fiction.
   `api/cron/clear-expired-holds` imports this service server-side,
   where `localStorage` is undefined — that endpoint cannot run.
2. **Subdomain URLs 404 in dev.** `elite-denver.localhost:3000/booking`
   returns 404; middleware detects the subdomain but never rewrites the
   path to `/elite-denver/booking`. Path-based URLs work. Use those.
3. **Every `.vercel.app` deploy is broken the same way.** `getSubdomain`
   returns `parts[0]` for any host with >2 parts, so it reads
   `yce-v3-git-main-...` as an agency slug and finds nothing. Needs an
   early `if (host.endsWith('.vercel.app')) return null`.
4. **`getAvailableSigns()` returns hardcoded mock data.** Its Supabase
   import is commented out. Not connected to `sign_library`.
5. **`layout-calculator.ts` never consults inventory.** It builds the
   display from the message string alone, so the preview can promise
   letters the agency doesn't own.
6. **The wizard ignores per-agency pricing.** `basePrice = 95` and
   `extraDayPrice = 10` are hardcoded in FOUR step components
   (display-customization, review, payment, confirmation). Those are
   elite-denver's real config values, copied in as a stopgap.
   `agencies.pricing_config` EXISTS and is populated — the six agencies
   charge $81/$95/$95/$95/$99/$111 with extra-day rates of $10-$15.
   The settings UI and `/api/agency/financial-settings` handle it
   correctly. The booking side has zero references to it. Fix: fetch
   config on wizard load (same pattern as the payment-methods call) and
   read from context in all four files.
7. **Zone 3's 60% fill minimum blocks checkout outright for ordinary inputs,
   not just a cosmetic issue.** Tried "Happy Birthday" / "Test Recipient"
   (a perfectly normal booking) and got permanently stuck on step 3: fill
   comes back 0%, no inventory hold gets created (the hold-creation code
   path is only reached when `meetsMinimumFill` is true), and
   "Continue to Payment" never enables — with no indication to the customer
   why. Only got past it by reusing the exact known-good STATE.md example
   ("Happy Birthday" age 33 / "Brandon"). Decoration signs also render as
   truncated text ("DE DE DE") on the inputs that do clear the gate — Zone 3
   is emitting labels, not looking up inventory. See the Zone 3 note below.
   This is very likely blocking most real customers today, not an edge case.
8. **`sign_library` CONTAINS NO LETTERS.** All rows are whole pre-made
   message boards ("Happy Birthday - Classic", "Congratulations
   Graduate") plus some generic real-estate seed data that doesn't
   belong in a yard-card product at all. `rental_price` is 0 on every
   row. `agency_inventory` IS populated for elite-denver with realistic
   quantity / available / allocated / deployed splits — so the
   availability math has real data to work against, just not for
   letters. Letters must be seeded from the sign-assets manifest before
   wiring the configurator to real inventory.

## Placeholder assets — generated, ready to install
315 transparent PNGs (A-Z, 0-9, punctuation, heart, star × 7 colorways)
rendered from OFL/Apache fonts. Nothing derived from vendor imagery.
`manifest.json` carries `widthIn`, `heightIn`, `baselineYPct`.
Install at `public/sign-assets/`. Generator script kept OUT of `public/`
(put in `tools/sign-generator/`).
Resolver written: `src/features/booking/services/sign-assets.ts`.
NOTE: the 4 font styles (classic/block/tall/rounded) map directly to the
existing Message Style / Name Style radios (Classic/Bold/Script/Fun).

## Dead code — REMOVED 2026-09-12
Everything previously listed here is deleted from the repo:
`src/temp-inventory/` (already gone before this pass) ·
`src/app/booking-site/` (had two live dangling links from the empty-orders
dashboard state — `View Booking Site` / `Configure Settings` — repointed to
`/${agencySlug}/booking` and `/${agencySlug}/settings` before deletion; see
`empty-orders-state.tsx`, `orders-board.tsx`, `[agency]/orders/page.tsx`) ·
`src/app/debug/`, `debug-auth/`, `debug-routing/`, `test-db/` ·
`makeAgencyIdNullable()` (app-code function removed from `supabase-client.ts`) ·
`scripts/create-test-users.ts`, `scripts/fix-prisma-lock.bat` (Prisma-era) ·
`vercel.json` Prisma dataproxy config (file now `{}`) ·
`@anthropic-ai/claude-code` prod dependency (removed, lockfile resynced)

**NOT done — needs a deliberate decision, not a sweep:** the `exec_sql`
Postgres RPC (arbitrary raw-SQL execution) that `makeAgencyIdNullable()`
called still exists in the live, shared database and is also still called by
three one-off scripts (`scripts/apply-migration.mjs`,
`scripts/apply-booking-migration.ts`, `scripts/add-confirmation-code.mjs`) —
all now obsolete since the migrations they applied are confirmed live (see
above). Dropping a DB-side function on a database shared with PantryPro is
irreversible and out of scope for this pass; flagging for an explicit
decision rather than doing it silently.

## Known, deliberately deferred
- RLS off on all YCE tables. Hardening task — before the first PAYING
  agency, not before the demo. Fix path is Clerk's Supabase third-party
  auth integration, then one policy pattern repeated.
- PantryPro's `pos_sales`, `pos_sales_items`, `pos_import_history`,
  `inventory_deductions` have RLS ON with no working policies —
  effectively locked. Its two real policies key off `auth.uid()`, null
  under Clerk, so they are dead code. This will surprise PantryPro when
  it resumes; it did NOT cause the YCE stall.
- **DECISION: split the shared database into two Supabase projects and
  normalize casing — TRIGGER: before the first paying agency onboards,
  or before PantryPro resumes active development, whichever comes
  first.** Deliberately NOT now: it is a new project, a 45-table data
  migration, a rewrite of every query in two codebases, re-pointed env
  vars and deploys, and a window where both products are broken. The
  shared schema has not broken anything in YCE and nothing on the path
  to a demo touches PantryPro's tables.
- Custom domain expired. `.vercel.app` still serves.
- 305 `console.log`, 72 `any`, 3 test files across 33.6k LOC.
- No `.env.example`. No baseline schema migration committed.
- Static single-stake sign vs. character-package tier: designed, never
  built in v3. `bundles` table + `bundle-creator.tsx` exist on the
  AGENCY side; customer side never got it. `isBundle`/`bundleContents`
  sit unused on the booking Sign type.

## RESOLVED — this was never a fork
`sign-selection.ts` is NOT a competing product model. It is the
weighted search meant to populate Zone 3/4 decorations from the
customer's Hobbies/Interests and Theme selections. It is unfinished,
not wrong — nothing calls it yet.
What runs today instead: `calculateZone3` passes the raw hobby string
to `createDecorationSign()` as a text LABEL with no inventory lookup,
and `getThemeDecoration()` picks at random from a hardcoded map
(`['Stars','Rainbow','Flowers']`). That is the "DE DE DE" on screen.

PRODUCT DIRECTION (decided):
Customer will eventually choose between a Single Stake package
(dropdown/filters over available pre-made signs) and a Lettered Message
package (the existing configurator, unchanged).
**Ship letters-only first.** The assembled character display is the
impressive one and it already works. Single Stake comes after the demo,
and `pricing_config` will need a `singleStakePrice` field for it.

NOTE: `bundles` are an INVENTORY PURCHASING concept, not customer-facing.
An agency buys a bundle from a supplier (e.g. one of each letter in a
green font, or 12 sports characters) and it auto-adds N signs to
inventory. Do not model bundles as a customer product.

## Next steps, in order
1. ~~Apply the three migrations by hand~~ — done 2026-09-12 (commit
   `80cb846`). ~~Re-test the payment step end-to-end~~ — done 2026-09-14,
   found and fixed a second, unrelated payment-blocking column-casing bug
   (PayPal, see VERIFIED WORKING above). Payment step confirmed rendering.
2. **Fix the Zone 3 60% fill gate blocking checkout for ordinary inputs**
   (see VERIFIED BROKEN #7) — either lower/fix the fill calculation or stop
   silently gating hold-creation on it. This is now believed to be a bigger
   blocker to a usable demo than the holds/localStorage issue below, since
   it can stop a customer before they ever reach payment.
3. Move holds server-side onto the real `inventory_holds` tables
4. Seed letters into `sign_library`, THEN connect `getAvailableSigns()`
   to `sign_library` / `agency_inventory` (see below — there are no
   letters in the library today)
5. Fix the renderer (per-asset width, `object-fit: contain`, baseline
   alignment via the sign-assets resolver), install the PNG set
6. Resolve the design fork above
7. Vendor conversation, demo in hand

## Reference docs and their status
- `PRODUCT.md` (repo root) — business rules and model, distilled from
  the 2025 architecture spec. Authoritative for WHY.
- The original `technical-architecture.md`, `project-guide.md` and
  `Enhanced-TDD-Protocol.md` have been archived at the workspace level.
  Everything still true was pulled into PRODUCT.md / ARCHITECTURE.md.
  The originals contain Prisma code, subdomain middleware, a stale
  schema (UUIDs, a `subdomain` column) and a step checklist ~9 months
  behind reality. **Do not implement from them.**

## OPEN QUESTION — spec vs code
Zone 3 fill requirement: the spec says 75%, `layout-calculator.ts` uses
`0.6`, and its own docstring says 75% while the code says 0.6. Pick one.

## NOT VERIFIED — check before trusting
- Whether the manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users from `sync-clerk-users.ts` still
  work in Clerk (admin@elite-denver.com is now confirmed live — see
  `getUserById` fix above — but its password had been silently reset:
  Clerk flagged the old shared `TestPass123!` as a compromised/leaked
  password and forced a reset on next login).
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS, untested against Next 15.3.4) causes
  issues. It booted fine; unknown beyond that.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
