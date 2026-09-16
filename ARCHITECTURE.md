# Architecture Map

## The six files that matter for the configurator
```
src/features/booking/
  components/booking-wizard.tsx                     6-step shell, zod per step
  components/steps/display-customization-step.tsx   the configurator (~730 LOC)
  components/display/DisplayGrid.tsx                renders 5 zones over lawn photo
  components/display/LetterStake.tsx                one character; dev/prod branch
  services/layout-calculator.ts                     message text -> ZoneSign[]
  services/inventory.ts                             holds + availability (letters manifest-backed, decorations/quantities still MOCKED)
```

## The five-zone display model — VERIFIED WORKING, do not redesign
```
Zone 1  event message + number + ordinal    top row
Zone 2  recipient name                       bottom row, centered
Zone 3  decorative fill                      flanks zone 2, sized by
                                             (zone1.width - zone2.width) / 2
Zone 4  backdrop elements                    density-derived from zone 3
Zone 5  bookends                             absolute left/right edges
```

## Data flow AS BUILT
```
wizard step -> LayoutCalculatorService.calculateLayout()
            -> loadAssetIndex() (sign-assets manifest, cached per call)
            -> LayoutCalculation { zone1..zone5 }, with style.prod.imageUrl
               set for letters/numbers/punctuation and Zone 3 Stars/Heart
            -> DisplayGrid -> LetterStake / DecorationSign / BackdropElement
```
The manifest lookup is asset *resolution* (which PNG for this character +
style + colorway) — a static, agency-agnostic catalog. It is NOT
inventory (ownership/quantity per agency), and real inventory is still
not in this path at all: `manifestSignSource` in `inventory.ts` reports
the same 315 assets with the same fake `availableQuantity: 99` for every
agency, so nothing here can reject a combo an agency doesn't own or
confirm there's enough of a letter to spell the message. That is defect
#5 in STATE.md (the file previously mislabeled this as #6, which is
actually the pricing defect — corrected here).

## Data flow INTENDED
```
wizard step -> availability check (sign_library + agency_inventory)
            -> layout calculation, constrained to owned assets
            -> server-side hold (inventory_holds + inventory_hold_items)
            -> render via sign-assets manifest
```

## SignStyle: the dev/prod split
`SignStyle.dev` = colored blocks keyed by sign type. **Deliberate
placeholder for distinguishing sign types visually, not unfinished
work.** `SignStyle.prod.imageUrl` = real image. `LetterStake` (and
`DecorationSign`/`BackdropElement`/`BookendSign`) branch on whether
`prod.imageUrl` is set. **Live since commits `742320c`/`e41f821`**: the
PNG manifest populates `prod.imageUrl` for zone1/zone2 letters and Zone 3
Stars/Heart via `resolveAsset()` calls in `layout-calculator.ts`. No new
field was needed — this was designed in from the start.

## Known renderer bug: stakes escape the preview box
`DisplayGrid` wraps each character in `flex-shrink-0`, and
`getResponsiveSize()` returns a `clamp()` based on VIEWPORT width with
no awareness of character count. Long messages overflow and get clipped
by `overflow-hidden`. The zone math is fine.
Fix: derive one scale factor from container width ÷ row width in inches
(`layoutRow()` / `pxPerFoot()` in `services/sign-assets.ts`), so
character count drives size. Same code path that makes real PNGs render
at correct relative widths and align on baseline rather than image
bottom.

## Zone 3/4 decorations — real selection, still no real art or inventory
`calculateZone3AndZone4()` in `layout-calculator.ts` does real
keyword-weighted selection today: `rankDecorationsByHobbies()` scores the
full `decorationCatalog` against the customer's Hobbies (ties keep
catalog order; zero-score entries are kept, not dropped, so nothing is
ever excluded outright), falling back to a random pick from
`getThemeDecorationPool()` only when no hobbies are picked. Of that
catalog, only `Stars`/`Heart` resolve to real art (`shape-star`/
`shape-heart` in the manifest, all 7 colorways) via
`DECORATION_SHAPE_KEYS` + `resolveAsset()` — everything else (Baseball,
Crown, Rainbow, ...) still renders as a colored `dev` circle because no
art exists for it. Selection here is NOT constrained by real inventory
(see Data flow AS BUILT above), and today's "Theme" input is the
decoration-picker's `characterTheme` field only — it has no relationship
to the customer's message and no representation in scoring beyond the
random-pick fallback. See the new configurator section below for the
intended fix.

`sign-selection.ts` (~300 LOC) remains unused dead code — a separate,
more ambitious weighted-search engine that predates the logic above and
was never wired up. Candidate for deletion (see STATE.md).

## Smart configurator (Theme/Style/Color/Hobby) — DESIGNED, NOT BUILT
Design conversation from 2026-09-16 (pointer in STATE.md). The intended
model, once the DB work below exists:
- **Message / recipient name**: free text, decoupled from style/colorway
  — any words render in any style/colorway the agency has.
- **Style + Colorway**: hard constraints sourced from `agency_inventory`
  — a customer can only pick combos the agency actually owns (e.g. one
  agency has red/green/gold letters, another has purple/green/blue).
  These determine which letter assets get used for zone1/zone2, plus a
  real sufficiency check: enough of each needed character, in that
  style/colorway, to spell the whole message + name.
- **Theme**: derived from the selected message itself (one message may
  carry one or more theme tags, e.g. "Happy Birthday" -> birthday-ish).
  A *weight*, never a filter — it never removes options, only biases
  scoring.
- **Hobbies**: a second, independent weight, additive to Theme.
- **Zone 3/4/5**: selected by weighted search combining Theme-weight +
  Hobby-weight against the agency's actual inventory for those
  categories — generalizing the rank-everything/never-exclude pattern
  already shipped for Zone 3 decorations (above) to also cover
  backgrounds/bookends, with Theme folded into the score instead of
  today's hobby-only weighting.

Blocked on, in order:
1. `sign_library` schema for letters — `character`/`colorway`/
   style-family columns, additive/nullable so existing pre-made-board
   rows are unaffected.
2. Per-agency inventory seed data — which agency owns which
   style/colorway combos. A business decision, not something to invent.
3. Message -> theme taxonomy — one theme per message or several, and
   where the mapping lives (hardcoded next to `eventMessages` in
   `display-customization-step.tsx`, or DB-driven).
4. Scoring formula for combining Theme-weight + Hobby-weight — not
   specified yet (additive sum vs. weighted, tie-breaking rules).

None of this is buildable without (1)-(3) being decided first — they're
data/business decisions, not implementation details.

## Inventory soft-hold — SPEC EXISTS, implementation stubbed
From the original architecture spec. This is the intended behavior and
what the CLI task should implement against:
- Triggered on PREVIEW GENERATION, not browsing
- 1 hour duration, `expires_at` timestamp
- Session-based tracking via `session_id`
- Automatic cleanup of expired holds (the cron endpoint's real job)
- Alternative suggestions offered on conflict

Table shape (matches what's live):
```
inventory_holds       id, agency_id, order_id?, session_id,
                      is_active, expires_at, created_at
inventory_hold_items  id, hold_id, sign_id, quantity, unit_price
```
`features/inventory/actions.ts` already writes these from the agency
side — match its patterns. The booking side stubs the whole thing into
`localStorage`; that stub is the defect.

## RLS — the correct policy pattern, for when hardening happens
The original spec had this right and the live database drifted from it.
Live policies use `auth.uid()`, which is ALWAYS NULL under Clerk. The
spec's pattern resolves the Clerk subject claim instead:
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY agency_isolation_orders ON orders FOR ALL USING (
  agency_id = (SELECT agency_id FROM users
               WHERE clerk_user_id = auth.jwt() ->> 'sub')
);
```
Requires Clerk configured as a Supabase third-party auth provider so the
JWT reaches Postgres. Do NOT write policies against `auth.uid()`.

## Pricing path
`agencies.pricing_config` (JSONB) -> `/api/agency/financial-settings`
-> `FinancialManagementSection.tsx` (agency settings UI). Complete.
The booking wizard does not touch any of it and hardcodes $95/$10 in
four step components. Wire it the same way payment-methods is fetched:
`/api/agency/[agencyId]/...` on wizard load, into wizard context.

## Tables — YCE only (25 more in this database belong to PantryPro)
```
agencies · users (SHARED WITH PANTRYPRO) · orders · order_items ·
order_signs · order_activities · sign_library · agency_inventory ·
bundles · inventory_holds · inventory_hold_items · sign_check_ins ·
activity_log · transactions
```
IDs are cuids (`cmcpperej000fq8br24m5cd06`) — a Prisma legacy. Prisma
itself was removed early in the project's life; the file-level relics
(`vercel.json` dataproxy config, `scripts/fix-prisma-lock.bat`,
`scripts/create-test-users.ts`) were deleted in the 2026-09-12 cleanup
(see STATE.md) — cuids are the only Prisma trace left, and that's a
data-format fact, not a dead file. Column casing varies BY TABLE:
`orders.agency_id` and `agency_inventory.agency_id` (verified against live
app code and the database; this previously said `orders."agencyId"`,
which was wrong). Always check.

## Routes
```
[agency]/dashboard | orders | inventory | customers | reports | settings
[agency]/booking/[[...path]]        public booking wizard
api/agency/[agencyId]/payment-methods
api/webhooks/{clerk,stripe,braintree,paypal}
api/cron/clear-expired-holds        currently non-functional
```

## Middleware
`src/middleware.ts` wraps `clerkMiddleware`. `getSubdomain()` handles
`.localhost` correctly but treats ANY production host with >2 dot-parts
as having a subdomain — which breaks all `.vercel.app` deploys. Real
subdomain routing requires a custom domain with a wildcard DNS record;
the expired domain is why none exists today.
