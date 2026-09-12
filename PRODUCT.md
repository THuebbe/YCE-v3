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
- **Zone 3 fill target: 75%.** NOTE: code uses `0.6`. Spec says 75%.
  Unresolved — pick one and make both agree.
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
Primary path is direct-to-agency via Stripe Connect. Platform account is
the failsafe when the agency's account fails, with an email alert to the
agency and a weekly automated retry. Braintree/Venmo and PayPal exist
because solo operators genuinely use them — this is market-researched,
not scope creep.

## Deliberate non-goals right now
Multi-location per agency · white-label branding · advanced analytics ·
public API · enterprise multi-agency management. All post-MVP.

## Superseded — do not resurrect
- **Prisma.** Removed early for causing more problems than it solved.
  Direct Supabase queries now. IDs are still cuids as a legacy.
- **Subdomain routing** (`agency-city.yardcardelite.com`). Replaced by
  agency slug in the path: `/<agency-slug>/booking`. Middleware still
  contains subdomain code; it is the reason every `.vercel.app` deploy
  breaks. See STATE.md.
- The original 8-week roadmap and its step checklist. Reality diverged
  ~9 months ago; the checkboxes are actively misleading.
