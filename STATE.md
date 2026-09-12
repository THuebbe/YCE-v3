# Where This Stands

Last verified: 2026-09-11 (app booted and clicked through end to end).
Last commit: 2025-09-06. Dormant ~12 months.
Supabase project was PAUSED; restored 2026-09-10. Free tier re-pauses
after ~7 days idle.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** "HAPPY 33RD BIRTHDAY" over
  "BRANDON" with flanking decorations and bookends, rendered in the
  preview box over the lawn photo. Ordinal insertion works. Zone 3 fill
  reported 69%. This is the part that was believed broken. It isn't.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.

## VERIFIED BROKEN
1. **Payment step 500s.** `column agencies.braintree_environment does
   not exist`. The three files in `migrations/` were written but NEVER
   APPLIED to the database. Fix = paste each into the Supabase SQL
   editor, in filename order. `20250806_add_booking_columns_to_orders`
   is the critical one — without it no order can be saved at all.
2. **Inventory holds are `localStorage`.** The UI says so out loud:
   "Using mock inventory hold for testing." Real `inventory_holds` /
   `inventory_hold_items` tables exist and are used by the AGENCY side
   (`features/inventory/actions.ts`). The booking side never got wired.
   Consequences: two customers can reserve the same physical letters;
   holds die on device switch; the `holdId` gating payment is fiction.
   `api/cron/clear-expired-holds` imports this service server-side,
   where `localStorage` is undefined — that endpoint cannot run.
3. **Subdomain URLs 404 in dev.** `elite-denver.localhost:3000/booking`
   returns 404; middleware detects the subdomain but never rewrites the
   path to `/elite-denver/booking`. Path-based URLs work. Use those.
4. **Every `.vercel.app` deploy is broken the same way.** `getSubdomain`
   returns `parts[0]` for any host with >2 parts, so it reads
   `yce-v3-git-main-...` as an agency slug and finds nothing. Needs an
   early `if (host.endsWith('.vercel.app')) return null`.
5. **`getAvailableSigns()` returns hardcoded mock data.** Its Supabase
   import is commented out. Not connected to `sign_library`.
6. **`layout-calculator.ts` never consults inventory.** It builds the
   display from the message string alone, so the preview can promise
   letters the agency doesn't own.
7. **The wizard ignores per-agency pricing.** `basePrice = 95` and
   `extraDayPrice = 10` are hardcoded in FOUR step components
   (display-customization, review, payment, confirmation). Those are
   elite-denver's real config values, copied in as a stopgap.
   `agencies.pricing_config` EXISTS and is populated — the six agencies
   charge $81/$95/$95/$95/$99/$111 with extra-day rates of $10-$15.
   The settings UI and `/api/agency/financial-settings` handle it
   correctly. The booking side has zero references to it. Fix: fetch
   config on wizard load (same pattern as the payment-methods call) and
   read from context in all four files.
8. Decoration signs render as truncated text ("DE DE DE") — Zone 3 is
   emitting labels, not looking up inventory. See the Zone 3 note below.
9. **`sign_library` CONTAINS NO LETTERS.** All rows are whole pre-made
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

## Dead code — delete on sight
`src/temp-inventory/` (orphaned, grep-verified) ·
`src/app/booking-site/` (duplicate of `[agency]/booking`) ·
`src/app/debug/`, `debug-auth/`, `debug-routing/`, `test-db/` ·
`makeAgencyIdNullable()` + the `exec_sql` RPC it calls (arbitrary SQL
execution function sitting in the database — drop it) ·
`scripts/create-test-users.ts` imports PrismaClient and can no longer run ·
`vercel.json` still configures Prisma dataproxy + `.prisma` includeFiles ·
`@anthropic-ai/claude-code` is in prod `dependencies`

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
1. Apply the three migrations by hand (unblocks payment)
2. Move holds server-side onto the real `inventory_holds` tables
3. Seed letters into `sign_library`, THEN connect `getAvailableSigns()`
   to `sign_library` / `agency_inventory` (see below — there are no
   letters in the library today)
4. Fix the renderer (per-asset width, `object-fit: contain`, baseline
   alignment via the sign-assets resolver), install the PNG set
5. Resolve the design fork above
6. Vendor conversation, demo in hand

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
- Whether the other 5 test users still exist in Clerk.
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS, untested against Next 15.3.4) causes
  issues. It booted fine; unknown beyond that.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
