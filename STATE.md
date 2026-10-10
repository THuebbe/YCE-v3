# Where This Stands

Last verified: 2026-10-10

Condensed 2026-10-10 from 434 lines; the full earlier text (audit details,
old verification notes) is in `git show aace018:STATE.md`.

## Now
- **Production** (`yce-v3.vercel.app`, Hobby): milestone 1 live since PR #6
  (2026-10-08) - real inventory, server-side sign holds, agency booking
  rules. PR #7 merged 2026-10-10: order check-in/cancel, documents,
  real onboarding data, time zone. Crons live and secret-protected (`/api/cron/*` → 401 without
  `CRON_SECRET`). **Still a demo, not sellable:** checkout never charges.
- **Branch `claude/m1c-booking-hardening`** (PR open, waiting on the
  user's click-through): booking-flow fixes from the 2026-10-10 review -
  payment choice, refresh keeps progress, post-order lock, blackout
  days, server letter check, agency-branded confirmation, phone layout -
  plus findable PDFs (Open PDF link in the toast, document links on
  order cards; the user couldn't find a generated pick ticket).
- **Waiting on the user (at a keyboard):** Stripe test-mode Connect setup
  + access for Claude, and which agency is the Express test (proposed
  texas-signs; west-branch stays the Standard test) → milestone 2.

## Environment and working style
- One branch + one PR per milestone; Claude tests on the Vercel preview
  (share link via Vercel MCP) before handing over; the user merges.
- Migrations in `migrations/` are applied by Claude through the Supabase
  MCP (user OK'd 2026-10-07) - DDL/updates go through; **DELETE/DROP
  statements wait for the user's approval and time out if they're away**
  (put those in their own file and hand them over).
- Browser E2E: headless Chromium via the project's Playwright
  (`/home/user/YCE-v3/node_modules/playwright/index.mjs`,
  `executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
  Wizard steps render twice (desktop + mobile) - target `:visible`.
- Dashboard sign-in in tests: `CLERK_SECRET_KEY` (dev instance) →
  `POST api.clerk.com/v1/sign_in_tokens` → open
  `/auth/sign-in?__clerk_ticket=…`. admin@elite-denver.com =
  `user_2zRKzusknd0Eko93RaAnYaNm72E`.
- Vercel Hobby keeps runtime logs 1 hour. Supabase free tier pauses after
  ~7 idle days; the daily keep-alive cron prevents it (DECISION
  2026-10-06: no paid tier while ~6 months from launch).

## VERIFIED WORKING (seen running)
- **2026-10-10, branch `claude/m1b-checkin-cancel`, preview `e78aeb7`**
  (signed in as admin@elite-denver): order YCE-2026-101575 listed its 20
  sign lines and $81.00 (was "0 signs", "$0.81"); Generate Pick Ticket →
  processing (+ document), Mark as Deployed → deployed (Cancel disabled);
  check-in 29 good / 1 damaged → completed, hold released
  (`checked_in`), damaged red star 20→19 in `agency_inventory`, notes and
  3 activity rows recorded; seeded order 0027 cancelled (hold released,
  refund request recorded, not processed). Test data restored after.
  Same functions tested in a rolled-back SQL block (not-deployed and
  short counts refused, completed/other-agency cancels refused).
- **2026-10-10, preview `ae3c06f`, seeded order 0022** (`order_items`,
  JSON address): address shown formatted; Generate Pick Ticket →
  processing, **Print Order Summary** → deployed, both PDFs uploaded to
  Blob and listed in `orders.documents`; check-in 1 damaged + 1 missing →
  completed, stock 39→38 and 52→51, 5 `sign_check_ins` rows. Status/stock
  restored; its 5 check-in + 3 activity rows remain (DELETE needs the
  user's approval). **Documents** (pick ticket, summary, checklist) fixed
  and rendered locally from real order YCE-2026-101575: all 20 lines,
  $81 + 2×$13 = $107, page breaks, JSON addresses. Server PDFs can't be
  opened from Claude's sandbox (Blob blocked) - only their upload is seen.
- **2026-10-10, review fixes.** PR #7 preview `b733158` (iPhone width):
  order details fits 390px (was 575), Order Activity lists the 3 status
  changes, Edit Signs disabled, no agency secrets in the page payload
  (`agencies(*)` embed removed), partial refund capped at $210 and $30
  saved to `orders.refund_amount`. Booking preview `71a776a` (iPhone):
  `?step=6` opens step 1; reload on step 3 keeps step + data + hold;
  PayPal choice sticks (methods faked in-browser - no test agency has
  Venmo/PayPal connected); Review buttons fit; terms show the real
  pickup day; a request with extra letters is refused ("reserved signs
  don't match"); order YCE-2026-896278 placed, confirmation names the
  agency, no email promise; reopening shows the confirmation with no
  way back. Blackout rule unit-checked locally (delivery/pickup day).
  Test orders: YCE-2026-201857 completed, YCE-2026-896278 cancelled.
- **2026-10-10, preview `529228d`, dashboard:** Recent Orders shows real
  sign counts (YCE-2026-101575: 30; was hardcoded "1"); order details
  Documents panel lists saved PDFs after a reload (was empty until
  generated in that view) and its buttons open the Blob URLs. Most seeded
  elite-denver orders (`ELITE-DENVER-*`) and YCE-2026-647960 have no sign
  lines in the DB at all, so "0 signs" there is the data, not a bug.
- **2026-10-10, onboarding on preview `d9c0e17`** as a brand-new Clerk
  test user (`onboarding-test+clerk_test@example.com`,
  `user_3KVXtQcipHtzhP9QALMcn3SVODb`, no `users` row): bad phone/website,
  reserved slug `pricing`, empty city and empty prices all refused; time
  zone preselected (America/Denver); landed on `/onboard-test-oxmz/
  dashboard`. Row saved phone, website (`domain`), city, both service
  areas, time zone, $89/$12; `users` row created and linked as ADMIN.
  Test agency `onboard-test-oxmz` + that Clerk user still exist (delete
  needs the user's approval).
- **Milestone 1 (2026-10-07, previews `81e0c8a`/`a216de6`):** bookings on
  elite-denver, texas-signs, sunny-signs-ca convert a temporary hold to an
  order hold + `order_signs`; two browsers racing for the last red Z →
  one reserved, the other "need 1, 0 free"; date rules (cutoff 2 /
  setup 2 / min rental 3) gave the right earliest date, total and hold
  window; changing dates drops and replaces the hold; settings "Order
  cutoff" saves; idle expiry over a real hour (untouched hold expired at
  60 min and freed its stock, a touched one slid); rate limit (3 live
  holds per IP per agency); seed checksum matches the manifest (344
  signs, 20 each, 6 agencies); agency inventory page lists the seed.
- Earlier, still true: per-agency pricing end to end (order
  YCE-2026-647960, $107 = $81 + 2×$13, server recompute); payment step
  clicks through (card/PayPal/Venmo UI only); five-zone layout, ordinals,
  real letter + heart/star art; dashboard login for seeded users
  (`getUserById` matches `clerk_user_id`); `pnpm dev` boots in ~6s.
- `getCurrentTenant()` (`lib/tenant-context-supabase.ts`) DOES resolve on
  the orders list and detail pages (2026-10-10) - the 2026-10-06 audit's
  "x-url is set on the response, so it never fires" was wrong in
  practice. (The inventory page uses its own user-based helper - the
  2026-10-07 note that cited it as evidence was mistaken.)

## Go-live blockers
1. **Checkout never charges** (`pi_mock_…`; card form is plain inputs) →
   milestone 2. Create the PaymentIntent from the server total.
2. **Clerk `user.created` webhook hasn't written a `users` row since
   2025-10** (found 2026-10-10). Onboarding now creates the row itself
   (branch), but check the webhook endpoint/secret in the Clerk dashboard
   - other `users` updates (name/email changes) still won't sync.
3. Agency subscription billing (main revenue) not built - milestone 3.
4. Clerk runs a development instance in production (`pk_test_`).
5. RLS off on every YCE table (app-level guards only) - fix before the
   first paying agency.
6. Customers can't self-cancel; late/damage fees not built - milestone 5.

## Known gaps (not blockers)
- "Edit signs" isn't built; the buttons are disabled (needs stock
  re-check and re-hold).
- Booking (after the m1c branch): the Customize preview is blank after a
  refresh until regenerated (the hold survives); changing dates leaves
  the old hold until it expires or is replaced; customers sharing an IP
  share the hold limit; no customer confirmation email; desktop and
  mobile copies of every step both mount.
- The orders board has no Cancelled column (cancelled orders vanish
  from it).
- `/api/agency/settings` PUT would wipe `settings.serviceAreas` (Zod
  strips unknown keys); nothing calls it today.
- Refunds: cancel only records the requested refund (`orders.refund_amount`,
  metadata) until Stripe.
- Dashboard stock counters (`available_quantity` etc.) ignore holds;
  the booking side uses `yce_sign_availability` (ARCHITECTURE.md).
- Sign Library tab lists all 315 letter variants and buries the 15
  pre-made boards; those boards' `/images/signs/*.jpg` don't exist. One
  unexplained 400 on My Inventory. Damage photos: no storage yet.
- Layout doesn't pick an alternative colorway on a shortage (the hold
  refuses by sign name instead); PRODUCT.md's "alternative suggestions"
  not built.
- Subdomain URLs 404 in dev (no rewrite) - use `/<slug>/booking`.
- Customers sharing one IP share the 3-hold limit; a spoofed browser time
  zone can move the cutoff by hours for agencies without a time zone.
- Check-in says "N removed from inventory" even for a sign with no
  `agency_inventory` row (some seeded signs) - nothing to reduce there.
- Preview has no `RESEND_API_KEY` (preview orders don't email).
- 300+ `console.log`, 70+ `any`, 3 (type-broken) test files; no
  `.env.example`; no committed baseline schema.

## Decisions (details in PRODUCT.md)
- Payments: money goes straight to the agency - Stripe Connect Standard
  (own account) or Express (turnkey), **direct charges**, no platform
  fallback. **Express application fee: flat $3/booking (2026-10-10)**,
  shown on the agency's statement/invoice, not on the customer's
  confirmation. Standard agencies pay no per-booking fee.
- Holds: temporary (configurator, 1h of inactivity) and order (until
  check-in/cancel). Check-in: **damaged and missing signs leave stock for
  good** (2026-10-10). Deployed orders can't be cancelled.
- Dates: setup + teardown days (default 1 each, free, block stock); order
  cutoff = calendar days before delivery (default 1); "end of day" in the
  agency's `operating_hours.timeZone`, else the customer's; extra days
  picked in Event Details. Setup/teardown editable in Elite later.
- Plans Essentials $49 / Elite $79 (annual $499/$799), optional 14-day
  trial, card up front. Cancellation fee 5% / 100% inside 24h, waivable.
  Late $25/day and damage $5/sign defaults, manual, waivable.
- Split the shared PantryPro DB - trigger: first paying agency or
  PantryPro resuming. Not before.
- Still open: subscription renewal failure handling (grace period?).

## Next steps
1. Booking-hardening PR: user click-through
   (check-in on a phone) and merge.
2. **Milestone 2: Stripe** - 2a Express onboarding + Payment Element +
   direct charge + order on payment success + card saved for fees +
   checkout terms; 2b Standard path check, replace the "YardCard Elite
   Processing - always enabled" toggle, refunds. Needs the user's Stripe
   setup first (walk them through it - new to Stripe).
3. Milestone 3: subscriptions. 4: setup checklist (inventory + payments
   gate bookings), payments/subscription onboarding steps. 5: customer
   cancel link, late/damage fees, edit signs.
4. Later: Venmo/PayPal fee collection, production Clerk + domain, smart
   configurator theming (ARCHITECTURE.md, designed not built).

## NOT VERIFIED - check before trusting
- `clear-expired-holds` cron route in production (its SQL was run by
  hand).
- Whether manager@elite-denver.com and the other agencies' test users
  still work in Clerk (admin@elite-denver.com does).
- Duplicate step rendering in dev (two stacked copies; suspect
  `AnimatePresence`) - query `:visible` / `disabled`, not one snapshot.
- Node 23 (non-LTS) beyond booting fine.

## Dead ends
- `/routing` ↔ `/auth/sign-in` loop was dev-machine clock skew (Clerk
  `nbf`), not code.
- Vercel refusing to deploy was `VULNERABLE_NEXTJS_VERSION` on
  next 15.3.4, fixed by 15.3.9 - not a build error.
- The "315-ish signs already seeded" memory was the image manifest; the
  DB had no letters until 2026-10-07. Old Supabase projects
  `yardcardelite`/`yardcard-booking` are dead (user may delete them).

## Reference docs
- `PRODUCT.md` - business rules, authoritative for WHY.
- `ARCHITECTURE.md` - how the pieces fit, incl. holds/availability and the
  designed-not-built smart configurator.
- Workspace-level `technical-architecture.md` / `project-guide.md` are
  Prisma-era and stale - do not implement from them.
