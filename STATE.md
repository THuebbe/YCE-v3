# Where This Stands

Last verified: 2026-10-19

Condensed 2026-10-10 from 434 lines; the full earlier text (audit details,
old verification notes) is in `git show aace018:STATE.md`.

## Now
- **2026-10-19 overnight (user asleep, pre-approved "do as much as you can
  toward launch"): milestones 3 + 4, security, customer emails.** Stacked
  PRs, merge in order: **#16** (STATE) → **#17** plans → **#18** billing +
  signup step → **#19** Elite policies → **#20** milestone 4 → **#22**
  customer emails → **#23** revenue fix. **#21** (RLS) is independent.
  - All migrations below are APPLIED: `20261019_agency_plan`,
    `_agency_subscriptions`, `_agency_policies`, `_yce_rls_backstop`.
  - Stripe test mode: products "Essentials plan"/"Elite plan", 4 prices by
    lookup key (`yce_{essentials,elite}_{monthly,annual}`), billing portal
    allows switching among them, platform webhook `we_1US6YN2Hwl27rYJO0x2fMaNM`
    (secret in Vercel `STRIPE_BILLING_WEBHOOK_SECRET`, prod + preview),
    coupons `yce_internal_test` / `yce_founding_tester`, promo code
    **FOUNDINGTESTER** (single use, 100% forever) for the user's tester.
  - Test agencies: texas-signs, sunny-signs-ca, west-branch on free Elite
    subscriptions (`yce_internal_test`); elite-denver on a real 14-day Elite
    trial (card 4242, `sub_1US6n52Hwl27rYJORRrdaQVu`, first charge Nov 2 -
    cancel it in the portal before then or it bills $79 in test mode);
    lederman-bonds, my-business, onboard-test-oxmz unsubscribed (closed).
  - After #20 merges, booking pages close for agencies without Stripe
    (sunny-signs-ca, lederman-bonds, my-business, onboard-test-oxmz).
  - Old dead Stripe webhook `we_1RKA9r2Hwl27rYJOozM6UHNT` (tempo-dev.app,
    every event) still exists - delete it in Stripe if unused (DELETE: user).
- **Production** (`yce-v3.vercel.app`, Hobby): milestone 1 live since PR #6
  (2026-10-08) - real inventory, server-side sign holds, agency booking
  rules. PR #7 merged 2026-10-10: order check-in/cancel, documents,
  real onboarding data, time zone. Crons live and secret-protected (`/api/cron/*` → 401 without
  `CRON_SECRET`). **Still a demo, not sellable:** checkout never charges.
- PR #8 merged 2026-10-16: booking-flow hardening (payment choice,
  refresh keeps progress, post-order lock, blackout days, server letter
  check, agency-branded confirmation, phone layout) + findable PDFs.
- **Stripe (test mode) connected 2026-10-16.** Platform
  `acct_1REKSs2Hwl27rYJO`. Connect webhook `we_1UR2lK2Hwl27rYJOQlQDnGBZ`
  → `/api/webhooks/stripe` (account/capability/person, payment_intent.*,
  charge.refunded, charge.dispute.created); its secret is in Vercel
  `STRIPE_WEBHOOK_SECRET` (takes effect on the next deploy). Stripe MCP
  can't create connected accounts - agencies connect through the app.
  west-branch = Standard test (`acct_1RkB70FdcQOC5bzL`), texas-signs =
  Express test.
- **Branch `claude/m2a-stripe-express`** (milestone 2a, PR #9, verified on
  preview): turnkey/Standard onboarding in Settings, Payment Element (direct charge
  on the agency's account, $3 application fee on the turnkey plan only), order
  created only after payment succeeds (`booking_checkouts`, webhook
  backstop, auto-refund if the hold can't convert), card saved for later
  fees. Migration `20261016_stripe_checkout.sql` APPLIED. Agencies
  without Stripe still get the no-charge demo checkout (now labelled as
  such) until milestone 4 gates bookings on payments.

- **Stripe account model (DECIDED 2026-10-17):** both plans create the same
  kind of account - Stripe liable for losses, agency pays Stripe's fees,
  full Stripe Dashboard. The turnkey plan (stored as 'express') differs
  only by the $3 fee. Stripe refused Express Dashboard + Stripe-liable for
  this platform (v1 and the Accounts v2 preview); legacy type 'express'
  makes the platform liable and bills it Stripe's fees. Revisit only if
  Stripe enables it (Stripe support).
- **Branch `claude/admin-phone-layout`** (PR #10): dashboard/settings/
  inventory at phone width + the sign-in "Redirecting..." hang (inline
  script never ran). Open questions for the user: 404 the placeholder
  Customers/Reports pages? Hide the fake "Subscription & Billing" card?

- **Email (2026-10-17):**
  - Resend sending-only key "yce-v3 (Vercel)" is in Vercel `RESEND_API_KEY`
    (it was never set before: agencies got no order emails).
  - `yardcard-elite.com` (bought in Vercel, Vercel DNS) is verified in
    Resend; its 4 DNS records (DKIM TXT, send MX/TXT, rsend CNAME) were
    added in Vercel.
  - `EMAIL_FROM` = `YardCard Elite <orders@yardcard-elite.com>`.
  - Customers still get no email from us (only Stripe's receipt), until the
    cancel link work.

- **Merged 2026-10-17:** PR #9 (2a Stripe + checkout terms), #10/#11 (phone
  layout, sign-in redirect, mock billing card + dead tests removed: tsc 0
  errors), #12 (email: Resend + verified yardcard-elite.com).
- **Milestone 2b, in chunks (user's request):**
  1. **PR #13 (merged 2026-10-17):** refunds on cancel through Stripe (platform
     keeps $3) + new terms $20/15%/48h, saved per order.
  2. **PR #14/#15 (merged):** Payment Settings shows real status (fake
     "YardCard Elite Processing", its 3.5% fee and the no-op "primary
     processor" picker removed; Venmo row added) + Agency Profile loads;
     `charge.refunded` webhook mirrors Stripe-dashboard refunds onto the
     order (verified on production).
  3. **Done 2026-10-18 on production:** Standard ("I already have a Stripe
     account") path. The user signed up elite-denver → `acct_1URjHtFl2xMJRcZS`
     (`yce_plan: standard`); webhook synced `charges_enabled` on its own.
     Booking YCE-2026-804821 ($81, 4242) paid on the agency's account,
     `application_fee_cents` 0, no platform fee in Stripe. Cancelled from the
     dashboard → $61 refunded ($81 − $20 minimum fee), order
     `partially_refunded`, checkout `refunded`.
  - **Milestone 2b complete.**
- **How Claude tests (sandbox):**
  - Browser runs: Playwright scripts in the session scratchpad
    (`e2e-pay.mjs` booking with a test card; `cancel-test.mjs`;
    `admin-sweep.mjs` 390px overflow).
  - Previews: `get_access_to_vercel_url` share link. Admin sign-in:
    Clerk ticket via `POST api.clerk.com/v1/sign_in_tokens` (single use).
  - The sandbox can't reach Stripe's onboarding page (b.stripecdn.com),
    api.resend.com or vercel.com, so the user does Stripe hosted signups.
  - Clean up test orders with `yce_cancel_order(...)` (needs a user id of
    that agency).
  - texas-signs = turnkey Stripe test agency (`acct_1URY21CAFUeJ6RMe`);
    west-branch and elite-denver (`acct_1URjHtFl2xMJRcZS`) = Standard.
  - Production is `https://yce-v3.vercel.app` (no share link needed);
    yardcard-elite.com is only the email domain so far.
- **Launch blockers (not milestones):** Vercel Pro (Hobby is
  non-commercial), production Clerk instance + domain, Stripe live mode
  (platform identity + live webhook/keys), platform Terms/Privacy pages.

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
  The wizard renders each step once since m2a (was twice).
- Dashboard sign-in in tests: `CLERK_SECRET_KEY` (dev instance) →
  `POST api.clerk.com/v1/sign_in_tokens` → open
  `/auth/sign-in?__clerk_ticket=…`. admin@elite-denver.com =
  `user_2zRKzusknd0Eko93RaAnYaNm72E`.
- Vercel Hobby keeps runtime logs 1 hour. Supabase free tier pauses after
  ~7 idle days; the daily keep-alive cron prevents it (DECISION
  2026-10-06: no paid tier while ~6 months from launch).

## VERIFIED WORKING (seen running)
- **2026-10-19, production after #24 + #21 merged:** elite-denver booking
  YCE-2026-683197 (4242) paid → Resend delivered the agency's "New Order"
  and the customer's "Your booking with Elite Yard Signs Denver: Tuesday,
  November 3, 2026" (event_date 2026-11-03, no off-by-one); cancel from the
  dashboard → $61 refunded and "Booking cancelled" delivered. Billing
  webhook: a metadata change on texas-signs' subscription synced the
  agency row within seconds (`subscription_synced_at`).
- **2026-10-16, branch `claude/m2a-stripe-express`, preview `32d4f05`,
  west-branch (Standard, `acct_1RkB70FdcQOC5bzL`)** at phone width: Stripe
  Payment Element on the agency's account; 4242 → order YCE-2026-630524
  paid, checkout `completed`, hold converted, no app fee; 3-D Secure card
  4000 0025 0000 3155 → challenge completed → YCE-2026-163750 paid; decline
  card 0002 → "Your card was declined…", checkout `failed`, hold kept for a
  retry. Both test orders cancelled after (test charges not refunded -
  refunds are 2b).
- **2026-10-17, same branch, preview `4f90bd3`, texas-signs (turnkey)**: the
  app created `acct_1URY21CAFUeJ6RMe` (Stripe liable for losses, agency
  pays Stripe fees, full Dashboard); the user did Stripe's hosted signup
  (the sandbox can't load b.stripecdn.com); after a failed test SSN,
  "Finish Stripe verification" reopened Stripe's form → charges + payouts
  enabled; Settings `?success=true` synced the DB. Card 4242 → order
  YCE-2026-914929 paid, checkout `completed`, **$3.00 application fee** on
  the platform (`fee_1URaBDCAFUeJ6RMeGn7i245K`). Test order cancelled.
- **2026-10-17, same branch, preview `4d2f83f`, texas-signs: checkout terms**
  - Review step shows the agency's booking terms; Place Order is disabled
    until "I agree" is ticked.
  - A request without consent is refused (400).
  - The order saves `terms_accepted_at` + `terms_snapshot`
    (YCE-2026-643256: paid, $3 fee, card-consent text).
  - Payment-methods request blocked in the browser → "Try again" (no
    demo form) → recovers.
  - Agency flipped to not-ready while the card was on the Review step →
    409 "your card was not charged", no order.
  - Test orders cancelled.
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
- **2026-10-10, the user opened a generated PDF on their phone** (production
  pick ticket for seeded ELITE-DENVER-296052, which has no sign lines, so
  an empty sign table). Blob-hosted PDFs open on a phone.
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
1. (done) Checkout charges real cards (milestone 2).
2. **Clerk `user.created` webhook hasn't written a `users` row since
   2025-10** (found 2026-10-10). Onboarding now creates the row itself
   (branch), but check the webhook endpoint/secret in the Clerk dashboard
   - other `users` updates (name/email changes) still won't sync.
3. (built, PR #18) Agency subscriptions. Live mode needs the same
   products/prices (same lookup keys), portal config and a live platform
   webhook + secret.
4. Clerk runs a development instance in production (`pk_test_`). Free to
   fix (Clerk free tier + yardcard-elite.com); also fixes the sign-in
   refresh that drops `?session_id` on the way back from Stripe Checkout.
5. (done 2026-10-19, PR #21) RLS backstop on YCE tables. STILL OPEN, the
   user's call: `users` (shared with PantryPro) and PantryPro's tables are
   readable/writable with the public anon key (advisor: rls_disabled_in_public).
6. (done 2026-10-19, PRs #27-#29) Customer self-cancel, late/damage fees,
   agency display edits - milestone 5.
7. Venmo and PayPal checkout aren't real: Venmo's `processVenmoPayment`
   requires a signed-in agency user (customers got "Unauthorized") and
   takes the amount from the browser; PayPal's form is a stub. Both used
   to save unpaid orders. Since #20 customers are only offered Stripe
   cards; the setup tabs still work. Building them = new milestone.
8. Vercel Pro + Stripe live: only when the first real agency pays (user's
   call to wait).
9. **Terms and Privacy are drafts** (`/terms`, `/privacy`, 2026-10-20, the
   user's working draft): Trad Tech LLC, Iowa law, helpdesk@tradtechie.com.
   Before go-live: research/compare, then professional review. The privacy
   policy promises deletion on request (by hand - no tooling) and no fixed
   retention period; the 3-year promise on the booking form was removed.
   Moving YCE to its own LLC later: check with Stripe first whether the
   platform account's legal entity can change - Connect accounts can't be
   moved to a new platform account.

## Known gaps (not blockers)
- Booking (after the m1c branch): the Customize preview is blank after a
  refresh until regenerated (the hold survives); changing dates leaves
  the old hold until it expires or is replaced; customers sharing an IP
  share the hold limit; desktop and
  mobile copies of every step both mount.
- The orders board has no Cancelled column (cancelled orders vanish
  from it).
- `/api/agency/settings` PUT would wipe `settings.serviceAreas` (Zod
  strips unknown keys); nothing calls it today.
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
- Plans Essentials $49 / Elite $79 (annual $499/$799), 14-day trial on
  the first subscription (BILLING_TRIAL_DAYS, 0 = off), card up front.
  Tier split DECIDED 2026-10-19 (PRODUCT.md): Elite = pick ticket, pickup
  checklist, own policies + booking rules, dashboard revenue; Essentials =
  the rest incl. order summary. Unpaid = booking page closed, 7-day grace.
  Cancellation default $20 or 15%, 48h. Late $25/day, damage $5/sign.
  Blackout dates on every plan (user confirmed 2026-10-19).
- Split the shared PantryPro DB: YCE becomes its own project AFTER the
  Victory Store demo (goal: win at least their signs, maybe a partnership)
  - user, 2026-10-19. Until then `users` and PantryPro tables stay as they
  are (anon-readable `users` is known and accepted for now; PantryPro is
  in development).

## Next steps
1. (done - PR #8 merged 2026-10-16)
2. (done - Milestone 2: Stripe, 2a + 2b, finished 2026-10-18)
3. (built 2026-10-19, PRs #17-#20, #22, #23) Milestones 3 + 4.
4. (done 2026-10-19) Production check of emails + billing webhook. Still
   the user's: open the billing portal once; the tester signs up with
   FOUNDINGTESTER.
5. Milestone 5: customer cancel link, late/damage fee charging, edit signs.
6. Later: real Venmo/PayPal checkout, production Clerk + domain, smart
   configurator theming (ARCHITECTURE.md, designed not built).

## NOT VERIFIED - check before trusting
- Stripe billing portal page itself (opens, but its assets don't load in
  Claude's sandbox) - the user should open it once.
- Daily `/api/cron/sync-subscriptions` (needs CRON_SECRET, runs after merge).
- `clear-expired-holds` cron route in production (its SQL was run by
  hand).
- Whether manager@elite-denver.com and the other agencies' test users
  still work in Clerk (admin@elite-denver.com does).
- Webhook backstop: the Connect webhook points at production, which runs
  the pre-m2a code until merge - preview orders were created by the
  synchronous path only.
- **Until PR #9 is merged, production keeps flipping texas-signs to "not
  ready"**: Stripe is still retrying hours-old account.updated events and
  the old handler copies their stale status. After merge every status event
  re-reads the account. If texas-signs shows the demo checkout after merge,
  open its Settings → Stripe tab once (re-syncs).
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
