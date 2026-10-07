# Where This Stands

**2026-10-06: production is up** (`/elite-denver/booking` → 200) after
the user restored the paused Supabase project. **But this is a demo, not
a sellable product** — see "Go-live blockers" below: checkout never
charges, dashboard order actions are fake, inventory isn't real.

**Unmerged:** branch `claude/vercel-host-and-pricing` (`e376b55`,
`c6875e4`, `cbbd63d`, `4724f90`, `a29daab`) — per-agency pricing, real
agency id/slug in the wizard, `.vercel.app` hostname fix, card data kept
off the server, server-side total check, Supabase keep-alive cron,
tenant-isolation fixes from the 2026-10-06 audit. Verified on its Vercel preview (see VERIFIED
WORKING); full click-through to an order still not done. Close PRs #1/#2.

Last browser click-through: 2026-09-14. Supabase free tier re-pauses
after ~7 idle days — it has now caused two outages.

## VERIFIED WORKING (seen running, not inferred)
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
6. ~~Order totals trusted from the client~~ — **fixed on branch
   (`cbbd63d`)**: server recomputes from `pricing_config`, rejects a
   mismatch (400 "price has changed"), stores the server total. When
   real Stripe lands, create the PaymentIntent from the same server
   total — never from the client's number.
7. **`sign_library` has no letters** — pre-made message boards + unrelated
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
- Plus BROKEN #1/#4/#5 (holds, inventory).

## Known, deliberately deferred
- **No `CRON_SECRET` in Vercel.** Keep-alive is open without it (by
  design, harmless read); `/api/cron/clear-expired-holds` falls back to
  the guessable `'dev-secret'`. Set `CRON_SECRET` in Vercel to lock both.
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
- **Cloud-session E2E is blocked:** the environment's network policy
  denies `*.vercel.app` and `*.supabase.co`, so a Claude session can't
  click through previews or run the app against the DB. Add both under
  Allowed domains (environment settings → Network access) to unblock.

## Onboarding / payments — open details (decisions in PRODUCT.md)
Decided 2026-10-07: website optional; service area = city+state,
informational; card up front for trials; customers pay in full.
Still open:
- Payments: can an agency mix (own Venmo + our Express for cards)?
- Dashboard setup checklist + "not accepting bookings yet" state until
  payments/pricing/inventory are done?
- Cancellations/refunds: window and who issues them (agency's
  processor; with Express the refund comes out of the agency's balance).
- `pricing_config.lateFee`: how is it collected? Charging later needs a
  saved card (Stripe only — Venmo/PayPal can't be charged after the fact).
- Subscription renewal fails (expired card): grace period, then booking
  page off? Stripe retries automatically; never hold agency funds (the
  archived "Held Funds System" idea is dead).
- Trial length.
- Fixed 2026-10-07 (`src/features/auth/actions.ts`): after creating an
  agency the form redirected to `/dashboard?agency=…`, a route that
  doesn't exist (code-read: likely 404). Now `/<slug>/dashboard`.
  "Lawn care" copy removed from onboarding, marketing and pricing pages.

## Next steps, in order
1. Click through to a placed order on the branch preview; merge; close
   PRs #1/#2.
2. **Real payments, Stripe first** — decisions needed first: Stripe
   Connect (money goes to the agency; the Stripe webhook already tracks
   `stripe_account_id`) vs. one platform account; who pays fees; deposit
   vs. full charge at booking. (Elements + server-created
   PaymentIntent on the agency's connected account, order created on
   payment confirmation, total recomputed server-side). Then Venmo, then
   PayPal — all three stay, shipped in sequence.
3. Rebuild dashboard order actions on Supabase (`actions-disabled.ts`).
4. Server-side holds on `inventory_holds`; real per-agency inventory
   (needs the sign_library letters decisions in `ARCHITECTURE.md`).
5. Production Clerk instance + domain; Supabase paid tier; tenant-filter
   audit.
6. Smart configurator theming — after the above, not before.

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
