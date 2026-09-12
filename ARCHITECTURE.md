# Architecture Map

## The six files that matter for the configurator
```
src/features/booking/
  components/booking-wizard.tsx                     6-step shell, zod per step
  components/steps/display-customization-step.tsx   the configurator (~730 LOC)
  components/display/DisplayGrid.tsx                renders 5 zones over lawn photo
  components/display/LetterStake.tsx                one character; dev/prod branch
  services/layout-calculator.ts                     message text -> ZoneSign[]
  services/inventory.ts                             holds + availability (MOCKED)
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
            -> LayoutCalculation { zone1..zone5 }
            -> DisplayGrid -> LetterStake / DecorationSign / BackdropElement
```
Inventory is NOT in this path. That is defect #6 in STATE.md.

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
work.** `SignStyle.prod.imageUrl` = real image. `LetterStake` branches
on whether `prod.imageUrl` is set. The PNG manifest populates `prod`.
No new field is needed — this was designed in from the start.

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

## Zone 3/4 decorations — designed, half-wired
`sign-selection.ts` (~300 LOC) is the intended engine: it weight-scores
inventory against the customer's message keywords, Theme, and
Hobbies/Interests, then fills Zone 3 to a target percentage. NOTHING
CALLS IT. `calculateZone3` currently emits the raw hobby string as a
label and `getThemeDecoration()` returns a random pick from a hardcoded
array. Connecting `sign-selection` to `calculateZone3` is the fix.

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
