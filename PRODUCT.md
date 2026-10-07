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
- **48-hour minimum advance booking.** Implemented and working.
- **Inventory soft-hold: 1 hour, session-based.** Triggered on PREVIEW
  GENERATION, not on browsing. Automatic cleanup of expired holds.
  The UI already says "signs reserved for 1 hour." See ARCHITECTURE.md
  for the hold spec — currently stubbed to localStorage.
- **Alternative suggestions on inventory conflict.** If the requested
  signs aren't available, offer substitutes rather than failing.
  `sign-selection.ts` has `getAlternatives()` for this; unused.
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
  short Stripe-hosted signup (ID + bank) from inside our app. We may
  take a per-booking *application fee* on these, which also covers what
  Stripe charges the platform per Express account.
- **Agency's account can't take payments** → their booking page says
  so. No fallback charging on the platform account.
Braintree/Venmo and PayPal exist because solo operators genuinely use
them — this is market-researched, not scope creep.

## Agency onboarding — DECIDED 2026-10-07, not built
Today `/onboarding` is one form (name, slug, description) that silently
defaults pricing, city and phone. Target flow:
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
$10/extra day, $25/day late fee, 5% cancellation fee, 24h notice).
Agencies may **mix** payment methods (e.g. cards online + Venmo).
Open details are tracked in STATE.md.

## Customer payment
**Customers pay in full at booking** (no deposits).

## Cancellations — DECIDED 2026-10-07
- Measured from the **scheduled delivery** (event date minus extra days
  before), never from when the order was placed. (Code today measures
  24h after order creation — wrong, must change.)
- Per-agency settings: **notice period** (default 24h) and
  **cancellation fee** (default 5% — covers Stripe's ~3% that isn't
  returned on refunds; the dashboard tells agencies this). Agency can
  **waive** the fee per order.
- Agency-initiated cancellations (can't fulfil) → full refund.

## Late fees — DECIDED 2026-10-07
Only when the agency **couldn't collect the signs** at the scheduled
pickup. Never automatic: after the agency **manually confirms the signs
are back**, the app computes `days late × pricing_config.lateFee` and
the agency **assesses it or waives it** (the late pickup may be the
agency's own fault).

## Damage fees — DECIDED 2026-10-07
Optional, same flow as late fees: check-in records damaged/missing
signs, the app proposes a fee, the agency assesses or waives it.
Amount: a per-agency setting (inventory doesn't track sign cost).

## Collecting late/damage fees — DECIDED 2026-10-07
- **Paid by card** → card saved at booking (with a clear "late/damage
  fees may be charged" notice) and charged after the agency assesses.
  If the charge fails, fall back to a payment link.
- **Paid by Venmo/PayPal** → the customer gets a payment link.

## Platform revenue
**Plans — DECIDED 2026-10-07** (supersedes the pricing page's
$29/$79/$149):
- **$49/mo** — the required core: customer booking, agency
  notification on new orders, inventory control.
- **$79/mo** — everything above + all reporting, and later the in-app
  store.
- **Annual:** $499/yr and $799/yr.
**14-day free trial is optional** — an agency can skip it and start
paying. Card required up front either way. We must be able to turn the
trial and any promotion/coupon **on and off** ourselves: coupons via the
Stripe dashboard, the trial via one platform setting (no admin UI yet).

**Subscriptions are the main income.** Agencies pay us via Stripe
Billing (subscription), separate from Connect. Not built yet — the
settings page shows mock subscription data. Per-booking application
fees on Express accounts are optional, secondary revenue.

## Deliberate non-goals right now
Multi-location per agency · white-label branding · advanced analytics ·
public API · enterprise multi-agency management. All post-MVP.

## Superseded — do not resurrect
- **Prisma.** Removed early for causing more problems than it solved.
  Direct Supabase queries now. IDs are still cuids as a legacy.
- **Subdomain routing** (`agency-city.yardcardelite.com`). Replaced by
  agency slug in the path: `/<agency-slug>/booking`. Middleware still
  contains subdomain code (now ignores `.vercel.app` hosts). See STATE.md.
- The original 8-week roadmap and its step checklist. Reality diverged
  ~9 months ago; the checkboxes are actively misleading.
