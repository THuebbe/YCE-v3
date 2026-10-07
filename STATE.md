# Where This Stands

Last verified: 2026-10-07

**2026-10-07: milestone 1 (real inventory + server-side holds + booking
rules + setup/teardown/cutoff date model + hold rate limit) built on branch `claude/m1-inventory-holds`, browser-tested on its
preview, PR open - NOT merged.** The DB side is already live (migrations
applied 2026-10-07 via Supabase MCP), so production's sign_library now
has the letter rows even though production code doesn't use them yet.

**2026-10-06: production is up** (`/elite-denver/booking` → 200) after
the user restored the paused Supabase project. **But this is a demo, not
a sellable product** — see "Go-live blockers" below: checkout never
charges, dashboard order actions are fake, inventory isn't real.

**2026-10-07: PR #4 merged to `main`** (per-agency pricing, card data
kept off the server, server-side total check, keep-alive cron,
tenant-isolation fixes, pricing page, product decisions) and live in
production. Old PRs #1/#2 closed. `CRON_SECRET` set in Vercel
(sensitive) *after* the merge deploy — it takes effect on the next
production deploy; until then `/api/cron/keep-alive` is open (harmless).

**Claude's cloud environment, set up 2026-10-07:**
- Allowed domains: `*.vercel.app`, `*.supabase.co`,
  `*.clerk.accounts.dev`, `api.clerk.com`, Stripe (`*.stripe.com`,
  `*.stripe.network`), Braintree/PayPal/Venmo hosts.
- Env var `CLERK_SECRET_KEY` (dev instance, `sk_test_`) — visible only
  in sessions started after 2026-10-07 ~17:30 UTC. Use it with Clerk's
  Backend API to sign in as existing test users (sign-in tokens); no
  stored passwords. Several test users already exist in Clerk.
- **Browser E2E works** (headless Chromium via the project's Playwright:
  import `/home/user/YCE-v3/node_modules/playwright/index.mjs` from a
  scratchpad script; `executablePath: /opt/pw-browsers/chromium-1194/
  chrome-linux/chrome`). Every wizard step renders twice (desktop +
  mobile copies) — target `#id:visible` / `button:visible`. Verified:
  live `/elite-denver/booking` loads, step 1 → Event Details.
- Vercel Hobby keeps runtime logs only 1 hour.

**Working style agreed:** one branch + one PR per milestone, Claude
tests on the preview before handing over, user merges.

Supabase free tier re-pauses after ~7 idle days — the keep-alive cron
(live since PR #4) should prevent a third outage.

## VERIFIED WORKING (seen running, not inferred)
- **2026-10-07, milestone 1 on preview `81e0c8a`** (headless Chromium
  scripts, DB checked after each):
  - Full booking on elite-denver (`37c9855`) and texas-signs (`81e0c8a`):
    Generate Layout creates a `temporary` hold (30 / 28 signs), placing
    the order converts it to an `order` hold with no expiry and writes
    `order_signs`. Orders YCE-2026-101575, YCE-2026-938350; both holds
    then released by hand (`yce_release_order_hold`).
  - Race: my-business red Z set to 1, two browsers generated "ZED" at
    once - one reserved, the other got "Z (classic/red): need 1, 0 free".
    Stock restored to 20.
  - **Date model v2 on preview `a216de6`** (setup/teardown days, order
    cutoff, extra days in Event Details): lederman-bonds temporarily at
    cutoff 2 / setup 2 / min rental 3 - earliest date today+4 shown live,
    3-days-out refused with the earliest date, extra days defaulted to 2,
    total $125 = $95 + 3x$10, hold window Oct 14..20 exactly as computed;
    changing dates afterwards dropped the hold and the regenerate
    *replaced* it (one live hold). sunny-signs-ca Sat order held Fri..Sun.
    Race re-run OK. Rules restored to defaults (1/1/1, min 1).
  - Settings page (signed in as admin@elite-denver via Clerk sign-in
    token): "Order cutoff" loads, saving 2 reached `booking_rules`, legacy
    keys dropped, setup/teardown kept, price untouched. Reset to 1.
  - Agency dashboard `/elite-denver/inventory` with the seed (signed in):
    "My Inventory" lists 356 items, totals 7444 = 344x20 + the old 564;
    so `getCurrentTenant()` DOES resolve on this page (the audit's "likely
    null on every host" is wrong at least here). Sign Library tab shows
    359 signs with real letter art. Mock signs had broken images - fixed
    with labeled PNGs in `public/sign-assets/placeholder/`
    (`scripts/generate-mock-sign-placeholders.py`), rows updated live.
  - Hold rate limit (SQL): 3 live holds per client key OK, 4th
    `rate_limited`, replacing your own still allowed; preview holds carry
    a `client_key` (Vercel passes the IP).
  - SQL functions exercised directly: overlap vs non-overlap, replacing
    only your own session's hold, unknown sign, wrong session / changed
    dates refused, order hold blocks dates after its start but not before.
  - Seed checksum matches the manifest exactly (344 signs = 45 glyphs x 7
    colorways + 29 mock; 2064 inventory rows, 20 each, 6 agencies).
- **2026-10-07, user click-through to a placed order** on preview
  `c6875e4` (elite-denver, 2 extra days): order `YCE-2026-647960` saved
  with the real agency id, total $107 (= $81 + 2×$13) matching the
  server-side recompute; agency notification email sent. Breakdown lines
  still showed $95/$10 on that build — fixed in `1c692af`, re-test on a
  later preview. That build also still logged the full payload incl.
  card fields (fixed in `cbbd63d`). Test agencies elite-denver,
  sunny-signs-ca and texas-signs had emails on real-looking domains;
  repointed to thuebbe.coding@gmail.com on 2026-10-07 (all six test
  agencies now notify the user's own inboxes).
- **2026-10-06, branch preview `dpl_AcVAANwgNwMeHbBaiVGGXDvjFrp8`:**
  server-rendered wizard props carry the real agency —
  elite-denver `{basePrice:81, extraDayPrice:13}`, texas-signs
  `{111, 15}`, correct `agencyId` + `agencySlug`; `x-subdomain` no
  longer set on `.vercel.app`. All 6 agencies have both prices set.
  (Client-side totals and order placement: not clicked through.)
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
0. ~~Production 404s~~ — Supabase was paused; restored by the user
   2026-10-06. **DECISION (user, 2026-10-06): no paid tier while ~6
   months from launch — keep-alive instead.** Daily Vercel Cron →
   `/api/cron/keep-alive` (one `agencies` read), scheduled in
   `vercel.json` at 15:17 UTC. Crons only run on **production**, so it
   does nothing until this branch is merged to `main`. Remove it when
   moving to a paid tier.
1. ~~Inventory holds are `localStorage`~~ — **fixed on branch (M1)**:
   server-side holds in `inventory_holds` via `yce_*` SQL functions under
   a per-agency advisory lock; see ARCHITECTURE.md "Data flow AS BUILT".
2. **Subdomain URLs 404 in dev**; middleware detects the subdomain but
   never rewrites the path. Use path-based URLs (`/elite-denver/booking`).
3. ~~`.vercel.app` breaks deploys~~ — **overstated; fixed on branch.**
   Re-read 2026-10-06: `getSubdomain` did misread the deploy hostname as
   a slug, but it only set a bogus `x-subdomain` header and caused one
   wasted agency lookup on non-dashboard routes. Booking resolves the
   agency from route params, dashboard routes from the path first —
   neither was broken by it. `.vercel.app` now returns null (`e376b55`).
4. ~~`getAvailableSigns()` is manifest-backed~~ — **fixed on branch (M1)**:
   `InventoryService` deleted; stock is `agency_inventory`. Old note:
   Fixed 2026-09-16 to read real PNG assets via `manifestSignSource`
   instead of pure mock data — but still not real per-agency inventory:
   every agency gets the same 315 assets, same fake `availableQuantity:
   99`. Supabase import still commented out.
5. **`layout-calculator.ts` still doesn't consult stock while laying out**
   — partly fixed (M1): every placed sign carries a `catalogKey` and the
   hold refuses shortages by name, so nothing un-owned can be booked. It
   still won't pick a different colorway for you. Old note: — asset
   *lookup* (which PNG) is wired now, but ownership/quantity per agency
   isn't, so it can still promise letters an agency doesn't own or
   doesn't have enough of.
6. ~~Order totals trusted from the client~~ — **fixed on branch
   (`cbbd63d`)**: server recomputes from `pricing_config`, rejects a
   mismatch (400 "price has changed"), stores the server total. When
   real Stripe lands, create the PaymentIntent from the same server
   total — never from the client's number.
7. ~~`sign_library` has no letters~~ — **seeded 2026-10-07** (placeholder
   rows from the manifest; real library = data swap). Old note: no letters — pre-made message boards + unrelated
   real-estate seed data only, `rental_price` 0 everywhere.
   `agency_inventory` populated for elite-denver, not for letters. This
   is now the specific blocker for the ARCHITECTURE.md configurator
   design, not just a nice-to-have — see that doc for what schema/seed
   decisions are needed first.

## Go-live blockers (code-read 2026-10-06, not yet fixed)
- **Checkout never charges.** `review-step.tsx` fabricates
  `paymentIntentId = 'pi_mock_' + Date.now()`; no route creates a Stripe
  PaymentIntent; card form is plain inputs, not Stripe Elements.
  Venmo/PayPal components exist, end-to-end capture unverified.
- ~~Raw card number + CVV POSTed to `/api/orders/create` and logged~~ —
  **fixed on branch (`cbbd63d`)**: payment step strips card fields before
  wizard state; full-payload logs removed both sides. Card digits still
  live in the browser form until Stripe Elements replaces it. Vercel logs
  from before the fix may hold test card data — consider purging.
- **Dashboard order actions are demo stubs** — advance status, cancel,
  check-in, edit signs show a "Demo Mode" toast. Real versions were
  stubbed when Prisma was removed (`orders/actions-disabled.ts` throws).
  Only document generation is real.
- **Clerk runs a development instance in production** (`pk_test_` key).
- **Agency subscription billing (main revenue) isn't built** — settings
  shows mock subscription data. Needs Stripe Billing, separate from
  Connect.
- ~~BROKEN #1/#4~~ fixed on branch; #5 partly.

## Known, deliberately deferred
- `CRON_SECRET` set in Vercel 2026-10-07 (production + preview); live
  from the next production deploy. `/api/cron/clear-expired-holds`
  `'dev-secret'` fallback and open `ADMIN_SECRET` POST removed on branch
  (M1); it now fails closed and runs daily.
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
- ~~`sign-selection.ts`~~ — deleted on branch (M1), was unused.

**Product direction (decided):** ship the Lettered Message configurator
first (already works); Single Stake (pre-made signs, no letters) comes
after the demo, needs `pricing_config.singleStakePrice`. `bundles` is an
inventory-purchasing concept for agencies, not a customer product.

## Tenant-isolation audit (2026-10-06, code-read)
Fixed on branch (`a29daab`):
- Deleted 5 unused unauthenticated routes. `/api/agency/by-slug`,
  `/by-domain` and `/api/user/agency` returned full `agencies` rows,
  incl. `braintree_private_key` (0 of 6 agencies have one stored, so
  nothing leaked); `/api/test-email` was an open email relay;
  `/api/send` a hello-world.
- `getUserById` rejects non-`[A-Za-z0-9_-]` ids (PostgREST `.or()`
  filter injection — reachable only via the deleted `/api/user/agency`).
- `requireAgencyMember()` guard (`features/auth/guards.ts`) on the
  browser-callable `generateDocument` action (was URL-tenant-only, no
  auth) and the dashboard data functions.
Checked and OK: every `/api/agency/*` route checks `user.agency_id`;
inventory actions derive agency from the user; all 7 dashboard pages
check membership; payment-methods route selects only public columns.
Branch self-review (`/code-review`, 2026-10-06) — fixed: price
*breakdown* lines in all four steps still showed hardcoded $95/$10 (only
totals had been switched); stray "0" in review summary; document guard
now checks the **order's** agency; clearer price-mismatch message (a
retry can't succeed without reload — wizard pricing is fixed at load).
Deliberately not changed: no `agencyId` fallback for pre-deploy clients
(old bundles send the bogus west-branch slug, so failing is better than
misfiling); `getUserById` now runs 3x per dashboard render (wrap in
React `cache()` if it matters); `getSubdomain` duplicated in two files.
**Big finding, NOT fixed:** middleware sets `x-url` on the *response*
(`response.headers.set`), not the request, so `getCurrentTenant()`'s
path-based resolution can never fire — it likely returns null on every
host. Everything in `orders/utils.ts` + `orders/data.ts` (incl.
document generation) would then throw "No tenant context". Fix:
`NextResponse.next({ request: { headers } })`. Needs a browser to
verify, and makes URL-tenant lookups live — keep the guards.
Remaining, not urgent:
- `orders/utils.ts` + `orders/data.ts` scope by URL tenant only; safe
  while called from guarded pages / guarded actions. Guard any new
  caller.
- `pollPayPalAccountsForStatusUpdates` is `'use server'` with no auth;
  unreferenced, so not exposed. Move to a cron route if it's ever used.
- `updateUserRole` / `removeUserFromTenant` are unimplemented stubs —
  scope them to the tenant when built.
- The guards are type-checked, not seen running (no browser here).

## Decisions needed before the next big build
- **Stripe — DECIDED 2026-10-07, see PRODUCT.md "Payments":** money
  always goes straight to the agency. Standard Connect for agencies with
  Stripe, Express Connect (turnkey, optional per-booking application
  fee) for agencies without; no platform-account fallback charging.
  Keys in Vercel are test keys (per user) — stay on test keys until
  launch; live keys charge real cards. Still open: full charge vs.
  deposit at booking. User is new to Stripe — walk them through the
  dashboard steps when building this.
- **Dashboard order actions:** `stateMachine.ts` defines the flow; open
  question is only what "check-in" and "edit signs" do to inventory
  counts. Build when a browser click-through is possible.
- ~~Cloud-session E2E blocked~~ — unblocked 2026-10-07 (see top).

## Onboarding / payments — open details (decisions in PRODUCT.md)
Decided 2026-10-07: website optional; service area = city+state,
informational; card up front for trials; customers pay in full.
Since decided (all in PRODUCT.md, 2026-10-07): payment mixing allowed;
setup checklist gating bookings on inventory + payments; cancellation
fees 5% before / 100% inside a 24h window, waivable, customer self-cancel
link; late + damage fees (manual, waivable, $5/sign damage default),
collected via saved card (card) / vaulted Venmo or payment link;
checkout terms + "I agree"; Essentials/Elite $49/$79, $499/$799 annual;
optional 14-day trial toggled by one platform setting, coupons in
Stripe. Still open:
- Subscription renewal fails (expired card): grace period, then booking
  page off? Stripe retries automatically; never hold agency funds (the
  archived "Held Funds System" idea is dead).

**Prior answers found 2026-10-07** (archive + code + live UI; NOT yet
confirmed by user — confirm before building). `archive/old-planning/`
holds only a stale checklist + rules; the detailed specs
(`technical-architecture.md`, `project-guide.md`) live outside this
repo. Git history searched too: the only deleted docs (`PROGRESS_LOG.md`,
`PRISMA_FIX_PLAN.md`) hold setup notes, no product decisions. In-repo
search is exhausted; remaining answers live in the off-repo specs.
- Cancellation: 24h after order creation → auto refund; later → manual
  refund (`orders/utils.ts` `isWithinCancellationWindow`,
  `cancel-order-modal.tsx`).
- Late fee: assessed manually at pickup on the Pickup Checklist PDF
  ("Days Late / Late Fee will be charged") — no auto-charge designed.
- Damage: check-in records good/damaged/missing + photos; no damage fee.
- Subscriptions: pricing page says 14-day free trial, Basic $29 /
  Professional $79 / Enterprise $149 per month, cancel anytime, annual
  discounts (copy partly template — "Up to 50 clients", "routing");
  settings mock shows "Professional $99". Archive Rule 13: proration,
  failed-payment handling, notifications, and "hold funds for lapsed
  subscriptions" (dead — conflicts with the 2026-10-07 decision).
- Payment mix: settings already let an agency connect several
  processors at once and pick a "Primary". But it shows **"YardCard
  Elite Processing — always enabled as fallback"**, i.e. the
  platform-collects model the user rejected 2026-10-07 — must become
  the Express option.
- ~~Booking rules ignored by the wizard~~ — **fixed on branch (M1)**,
  `features/booking/booking-rules.ts`, client + server - order cutoff in
  days before delivery, setup/teardown days (see NOT VERIFIED "M1
  decisions"). Old note: Agencies save `booking_rules` (lead time default 48h,
  min/max rental days, same-day toggle) but `booking/types.ts`, the
  event-details step and `/api/orders/create` hardcode 48h.
- Fixed 2026-10-07 (`src/features/auth/actions.ts`): after creating an
  agency the form redirected to `/dashboard?agency=…`, a route that
  doesn't exist (code-read: likely 404). Now `/<slug>/dashboard`.
  "Lawn care" copy removed from onboarding, marketing and pricing pages.

## Next steps, in order
All product decisions needed for these are in PRODUCT.md (2026-10-07).
One branch + PR per milestone, browser-tested on its preview first.
1. ~~**Real inventory + server-side holds**~~ — built, PR open; merge
   after the user's own click-through.
   (PRODUCT.md "Placeholder data rule"): stock from `agency_inventory`
   rows (seed plenty of every sign for test agencies), holds in
   `inventory_holds`, wizard honours `booking_rules` (lead time,
   rental days — currently hardcoded 48h).
2. **Stripe Express + real test charges** — Connect Standard/Express,
   card saved for later fees, checkout terms + "I agree", order created
   on payment confirmation from the server total. Replace the
   "YardCard Elite Processing — always enabled" settings toggle.
3. **Agency subscription billing** (Essentials/Elite, monthly/annual,
   optional 14-day trial, card up front, promo codes).
4. **Onboarding + dashboard setup checklist** (inventory + payments gate
   bookings).
5. **Cancellation link + late/damage fee flows**; rebuild dashboard
   order actions (`actions-disabled.ts`).
6. Later: Venmo/PayPal fee collection, production Clerk + domain,
   middleware `x-url` fix (see audit), smart configurator theming.

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
- **M1 items not seen running:** the hold's sliding 1h expiry over a
  real idle hour (only the touch call was exercised); the
  `clear-expired-holds` cron (production-only); the agency dashboard
  inventory page now listing 344 rows per agency (not opened - may need
  filtering); a human click-through on a phone.
- **M1 decisions (user, 2026-10-07), built:** setup + teardown days
  (default 1 each, free, block stock; editable in Elite at the permissions
  stage - no UI yet); order cutoff = calendar days before delivery
  (default 1; replaces lead-time hours + same-day toggle; business days
  rejected for now - needs a working-days calendar); "end of day" in the
  agency's `operating_hours.timeZone`, else the customer's browser zone
  (only west-branch has one); extra days live in Event Details, the
  configurator pricing card is gone; hold rate limit 3 live / IP / agency
  and 30 created / IP / 10 min (one script stopped; many IPs not - Vercel
  firewall/BotID later). Changing dates now drops the hold in Event
  Details, so the old "fails at Place Order" gap is closed.
- **Inventory UI with a real letter library (product question, not a
  bug):** the Sign Library tab lists every glyph x colorway (315 letter
  cards) and buries the 15 pre-made boards. Grouping by glyph/colorway is
  a dashboard design task for milestone 4/5. The 15 original boards'
  `/images/signs/*.jpg` don't exist (pre-existing, broken before M1).
  One unexplained 400 on the My Inventory tab (not traced).
- **Code review of the M1 diff (2026-10-07, `/code-review high`):** fixed
  - a wizard session's live holds are now replaced server-side (a reload
  or failed regenerate used to stack holds); converting a hold the expiry
  cron already deactivated now works; the order route checks whether a
  "failed" conversion actually committed before rolling the order back;
  date labels share `formatDay`. All three DB fixes tested in a
  rolled-back SQL block. Not fixed, by decision: order holds have no end
  until check-in (M5) - **every test/real order permanently removes its
  signs until released by hand**; shared-IP customers share the 3-hold
  limit; a spoofed browser time zone can shift the cutoff by hours when
  the agency has no time zone (fix: agency time zone at onboarding);
  old-shape `booking_rules` fall back to defaults (test agencies only);
  dashboard stock counters still ignore holds (M5); an agency changing
  setup/teardown days mid-checkout fails that one order (`dates_changed`).
- ~~Pending approval~~: old 7-arg `yce_create_booking_hold` dropped and the
  leftover test `order_signs` row deleted by the user, 2026-10-07.
- ~~Leftover test row~~ on YCE-2026-647960: deleted by the user 2026-10-07.
- **Preview has no `RESEND_API_KEY`** — preview orders log "Failed to
  send email"; set it for Preview in Vercel if preview emails matter.
- **Per-agency pricing in the wizard (branch, `e376b55` + `c6875e4`).**
  Server props verified (above); still unverified end to end. Booking page
  reads `pricing_config` server-side → wizard context →
  `calculateBookingTotal()` (`features/booking/pricing.ts`), replacing
  four $95/$10 copies. Also removes hardcoded
  `agencyId: 'yardcard-elite-west-branch'` (a slug!) from order creation,
  layout generation and soft holds. `c6875e4`: the order API resolves a
  *slug* (`getAgencyBySlug`), so the wizard sends `agencySlug` (API field
  renamed `agencyId` → `agencySlug`); the first commit alone would have
  failed every order. 2 test orders (Sep 14-19) were misfiled under
  west-branch by the old hardcode. Check: book on two
  agencies with different prices; totals should differ and the new
  `orders.agency_id` should be the real cuid. No valid `basePrice` →
  "not taking online bookings" message; missing `extraDayPrice` → 0
  (moot today: all 6 agencies set it).
- **Sep 19 commits made outside a Claude wrapup** — `4cf60ac` (letters
  touch, recipient name re-centered, separate Message/Name color
  pickers) and `0af5f32` (Event Date typing crash; was VERIFIED BROKEN
  #0). Read in diff, not seen running.
- Review step's layout preview now passes style/colorways (`cbbd63d`);
  before, it likely rendered default red. Not seen running either way.
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed; its password was silently reset
  (Clerk flagged the old shared `TestPass123!` as compromised).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
