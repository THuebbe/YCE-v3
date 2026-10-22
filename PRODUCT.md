# YardCard Elite — Product Rules & Business Model

Distilled from the original architecture spec (2025). This is the WHY
behind the code. Where code and this file disagree, it's a bug or a
deliberate change — decide which, then update one of them.

## What it is
Multi-tenant SaaS for yard card rental agencies. Target customer is a
solo owner/operator running the business from a phone or tablet.
Business model: **$49/month per agency.** Target 500 agencies in 3 years.
MVP operating cost ~$90/month (Vercel + Supabase + Resend + Clerk), so
the model is profitable from roughly the second agency.

## Booking rules (these are product decisions, not implementation detail)
- **Lead time: order cutoff + setup days** (replaced the old 48-hour
  minimum, 2026-10-07). Per-agency `booking_rules`, see STATE.md "Decisions".
- **Inventory soft-hold: 1 hour, session-based.** Triggered on PREVIEW
  GENERATION, not on browsing. Automatic cleanup of expired holds.
  Server-side since milestone 1 (`yce_create_booking_hold`); see
  ARCHITECTURE.md for the hold spec.
- **Alternative suggestions on inventory conflict.** If the requested
  signs aren't available, offer substitutes rather than failing.
  Not built (today the hold refuses and names the short sign).
- **Zone 3 fill target: 75%.** `layout-calculator.ts` now enforces 75%
  (fixed 2026-09-14; previously hardcoded `0.6`, contradicting this spec).
- **24-hour cancellation cutoff** with auto-refund logic. Not built.
- **3-year customer data retention.** The booking form already tells
  customers this, so it is a promise already being made.

## Order lifecycle
```
Pending    -> Pick Ticket generated
Processing -> Order Summary printed
Deployed   -> mobile check-in, Pickup Checklist
Completed  -> final reporting
```
Report priority order: Order Summary (emailed to customer + agency),
Pick Ticket (deployment instructions), Pickup Checklist (return
tracking). PDF generation with HTML fallback on failure.

## Order numbering
`agency_code` + sequential counter: `AG001-0001`. Display number is the
short form (`0001`). Each agency has its own counter.

## Pricing
Per-agency, in `agencies.pricing_config` (JSONB): `basePrice`,
`extraDayPrice`, `lateFee`. Agencies set these in settings.
FUTURE: a Single Stake package (one pre-made sign) priced separately
from the Lettered Message package (assembled character display). Needs
a `singleStakePrice` field. Ship letters-only first.

## Payments
**DECIDED 2026-10-07 (supersedes the "platform account as failsafe"
plan):** customer money always goes straight to the agency; the
platform never holds or forwards it (collecting on our own Stripe
account and paying agencies later breaks Stripe's terms and risks
money-transmitter rules).
- **Agency already has Stripe** → Stripe Connect *Standard* (links
  their account; what `features/payments/actions.ts` does today).
- **Agency has no payment setup (turnkey)** → Stripe Connect *Express*:
  short Stripe-hosted signup (ID + bank) from inside our app. We take a
  per-booking *application fee* on these, which also covers what Stripe
  charges the platform per Express account. **DECIDED 2026-10-10: flat
  $3 per booking**, deducted from the agency's payout; shown on the
  agency's statement/invoice, **not** on the customer's confirmation.
  Agencies on their own Stripe (Standard) pay no per-booking fee.
  (The 5% "service fee" in the settings code belongs to the rejected
  platform-collects model - dead code, not this fee.)
- **Agency's account can't take payments** → their booking page says
  so. No fallback charging on the platform account.
Braintree/Venmo and PayPal exist because solo operators genuinely use
them — this is market-researched, not scope creep.

## Agency onboarding — DECIDED 2026-10-07; steps 1-2 built 2026-10-10
`/onboarding` asks for business basics, cities served, time zone and
pricing. Payments and subscription steps wait on milestones 2-3. Target flow:
1. **Business basics** — name, slug, phone, **main website** (optional;
   customers are sent back there after a successful booking, else to our
   confirmation page), **service area as multiple city+state entries**
   (informational only — never blocks a booking).
2. **Pricing** — set during onboarding (reuse the settings form), not
   left at defaults.
3. **Payments** — a toggle: *Set up your payment processor* (Stripe,
   Venmo, PayPal) or *Use ours* (Stripe Express). See "Payments".
4. **Subscription** — trial/plan, with a **promotion code** field.
   **Card required up front**, even for the trial.
**Inventory is NOT an onboarding step** — done later in the dashboard;
it's long and operators may not have the details at signup.

**Setup checklist (dashboard), DECIDED 2026-10-07:** shown until
complete. **Inventory and payments gate bookings** — until both are
done the booking page says "not accepting bookings yet". Everything
else ships with defaults the checklist recommends reviewing ($95 base,
$10/extra day, $25/day late fee, cancellation $20 or 15% with 48h
notice).
Agencies may **mix** payment methods (e.g. cards online + Venmo).
Open details are tracked in STATE.md.

## Customer payment
**Customers pay in full at booking** (no deposits).

## Cancellations — DECIDED 2026-10-07
- Measured from the **scheduled delivery** (event date minus extra days
  before), never from when the order was placed.
- Per-agency settings (later; Elite): **notice period** and two fees.
  **Defaults REVISED 2026-10-17** (from real yard card vendors' terms:
  flat ~$25 fees, non-refundable deposits, half back late): **48h** before
  delivery; before it, refund minus **$20 or 15%, whichever is more**;
  inside it, no refund. Weather / can't install = full refund. The
  platform **keeps its $3 in every cancellation** (also agency-cancelled;
  matches Peerspace). Agency can **waive** any fee per order. Each order
  saves the rules it was booked under; orders before 2026-10-17b keep
  24h / 5%.
- Agency-initiated cancellations (can't fulfil) → full refund.
- **Customers cancel themselves** via a "Cancel booking" link in the
  confirmation email (customers have no accounts): it shows the refund
  the fee rules produce, the customer confirms, the refund runs — no
  agency work. The confirmation email also states the cancellation
  policy (same terms as the checkout "I agree").

## Late fees — DECIDED 2026-10-07
Only when the agency **couldn't collect the signs** at the scheduled
pickup. Never automatic: after the agency **manually confirms the signs
are back**, the app computes `days late × pricing_config.lateFee` and
the agency **assesses it or waives it** (the late pickup may be the
agency's own fault).

## Damage fees — DECIDED 2026-10-07
Optional, same flow as late fees: check-in records damaged/missing
signs, the app proposes a fee, the agency assesses or waives it.
Amount: a per-agency **per-sign** setting, **default $5** (Victory Signs
retail is ~$2.80–$3.85/letter in sets; $5 covers replacement + shipping).
Inventory doesn't track sign cost.

## Collecting late/damage fees — DECIDED 2026-10-07
- **Paid by card** → card saved at booking and charged after the agency
  assesses. If the charge fails, fall back to a payment link.
- **Paid by Venmo** → Braintree can save ("vault") the Venmo account
  for later charges; use it if the agency's Braintree account allows,
  else a payment link. Verify in Braintree sandbox before relying on it.
- **Paid by PayPal** → payment link.
- Checkout shows the agency's terms (auto-generated from its settings,
  readable on demand) and requires an **"I agree"** checkbox — needed
  for consent to later charges and as chargeback protection.
- Rejected: hotel-style card *holds* (authorize now, capture later).
  Holds expire after ~7 days (≤30 with extended authorization, only for
  some merchant types) and bookings are often weeks out; they also
  contradict "pay in full at booking".

## Placeholder data rule — DECIDED 2026-10-07
Until the Victory Signs library exists, everything must work exactly as
it will live — real inventory checks, holds, setup-checklist gate —
except that the test agencies happen to own plenty of every sign.
Swapping in the real library must be a **data** change, not a code
change. (True since milestone 1: stock comes from `agency_inventory` and
holds are server-side.)

## Platform revenue
**Plans — DECIDED 2026-10-07** (supersedes the pricing page's
$29/$79/$149):
- **Essentials, $49/mo** — the required core: customer booking, agency
  notification on new orders, inventory control.
- **Elite, $79/mo** — everything above + all reporting, and later the in-app
  store.
- **Annual:** $499/yr and $799/yr.
- **Tier split — DECIDED 2026-10-19** (replaces the 2026-10-07 direction).
  Essentials is true to its name: only what's needed to run an agency.
  Everything else is Elite.
  - **Essentials:** customer booking, agency email on each new order,
    inventory, the order board (start → deploy → check-in → cancel), the
    **order summary** PDF, own prices (base, extra day), waive any fee on
    an order. Policies run on the defaults. Dashboard: order counts.
  - **Elite:** + the deployment paperwork (**pick ticket, pickup
    checklist**), **policy settings** (cancellation window and fees, late
    fee, damage fee, booking rules), **dashboard revenue** cards.
  - **Blackout dates are on every plan** (confirmed by the user 2026-10-19:
    an essential function).
  - Locks are enforced on the server, not only hidden in the UI
    (`features/billing/entitlements.ts`).
  - Not in either plan yet (later, unpriced): customer list, analytics
    (forecasting, report builder, scheduled reports), in-app store.
- **Billing — DECIDED 2026-10-19:**
  - An unpaid agency (never subscribed, cancelled, or renewal failed past
    grace) gets its **booking page closed**. The dashboard keeps working,
    so it can finish existing orders and pay. Existing orders are never
    touched.
  - **7-day grace** after a failed renewal while Stripe retries.
  - **Trial on at launch** (14 days, card up front).
  - The first tester agency is free through a **100%-off-forever
    coupon**, so it goes through the real signup path.
**14-day free trial is optional** — an agency can skip it and start
paying. Card required up front either way. We must be able to turn the
trial and any promotion/coupon **on and off** ourselves: coupons via the
Stripe dashboard, the trial via one platform setting (no admin UI yet).

**Subscriptions are the main income.** Agencies pay us via Stripe
Billing (subscription), separate from Connect (built in milestone 3).
Per-booking application fees on Express accounts are optional,
secondary revenue.

## Future features — not at launch (recorded 2026-10-19)
Kept here so the ideas survive; the placeholder pages that described
them (`/[agency]/customers`, `/[agency]/reports`) were removed because
agencies could open them by URL. Git history has the full mockups.
- **Popular signs (Elite):** the dashboard card. Count displays by
  message and theme, not individual letters (letters always "win").
- **Customers:** customer list and search, profiles with order history,
  contact details, notes. Later: lifetime value and repeat rate,
  segments (high value, seasonal, inactive), booking reminders and
  follow-up emails/SMS, a customer portal (track, rebook), export.
- **Reports and analytics (Elite):** revenue trends, payment and refund
  analysis, sign utilization and seasonal trends, deployment times,
  forecasting, a report builder, scheduled reports, bulk document
  printing. PDF export with the existing PDF code.
- **Team management (enterprise):** several users and locations per
  agency, with roles. The old not-implemented stubs were removed; the
  shared `users` table needs the PantryPro split first.
- **Venmo and PayPal at checkout:** after Victory Store, before go-live.
- **Public website:** about, contact, marketing. Built last, on purpose:
  no traffic before the product is ready.
- **Funnel landing pages with a quiz (decided 2026-10-22):** not the main
  marketing page (that leads with the live yard demo and self-serve
  signup). Later, for visitors not ready to sign up: e.g. "Is a yard sign
  business right for you?" or a checkup that recommends Essentials or
  Elite. Build on a TypeScript port of PantryPro's `scoring.js` with its
  fixes (unanswered questions inflate the score; lead fields hardcoded to
  q11-q14; two insight systems; unused minImpact/priority; invented
  stats in the copy) and its own leads table with RLS on. Never reuse the
  shared `quiz_submissions` table.
- **Sign packages (was "bundles", recorded 2026-10-22):** a supplier's
  package, e.g. Victory Store's sports pack (2 soccer balls, 2 footballs,
  basketballs, baseballs...). Its purpose is receiving stock: add the
  package once and every sign in it, in its quantities, goes into the
  agency's inventory. Maybe later booking uses packages to find related
  signs (football goes with baseball), but individual signs already
  cover that. Needs its own tables: platform-curated packages with
  package items (sign + quantity), never edits to shared
  `sign_library` rows. The old agency-made bundle creator was removed
  2026-10-22: no quantities, one bundle per sign, no agency scoping, and
  an unauthenticated server action that rewrote shared library rows.
  The empty `bundles` table and `sign_library.bundle_id/bundle_position`
  columns are unused until then.
- **Custom signs on the booking page (recorded 2026-10-22):** agencies
  buy signs outside the platform library and upload them (Signs >
  Custom). They can be stocked today but booking can't place them: the
  layout uses the platform sign art. Needs a format check on upload
  (cut-out PNG, size, maybe an editor or AI review) and a way to put a
  custom sign into a display, e.g. as a decoration.

## Deliberate non-goals right now
Multi-location per agency · advanced analytics ·
public API · enterprise multi-agency management. All post-MVP.
(White label moved in: booking pages wear the agency's brand and accent
colors and logo from `agencies.branding`, decided 2026-10-22; the settings
screen to save them comes with the dashboard redesign. Plan gating, Elite
or a $5 add-on, is still open.)

## Superseded — do not resurrect
- **Prisma.** Removed early for causing more problems than it solved.
  Direct Supabase queries now. IDs are still cuids as a legacy.
- **Subdomain routing** (`agency-city.yardcardelite.com`). Replaced by
  agency slug in the path: `/<agency-slug>/booking`. Middleware still
  contains subdomain code (now ignores `.vercel.app` hosts). See STATE.md.
- The original 8-week roadmap and its step checklist. Reality diverged
  ~9 months ago; the checkboxes are actively misleading.
