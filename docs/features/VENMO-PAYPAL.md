# Venmo and PayPal at checkout

Status: **PLAN, waiting on the owner (2026-11-06).** Not built. The owner
asked to do Venmo while waiting on Victory Store. This page is the plan to
approve before any code.

## Where it stands (checked 2026-11-06)
- Customers are only offered Stripe cards (since #20). The Venmo and PayPal
  tabs in Settings still exist.
- **No credentials:** production has no `PAYPAL_*` or `BRAINTREE_*`
  variables, and no agency has connected either provider. Nothing can be
  tested until the owner has provider accounts, so code alone can't move
  this forward.
- **The Braintree code sends every agency's money to one account.**
  `initializeBraintreeMerchant()` saves the platform's own
  `BRAINTREE_MERCHANT_ID` on every agency, so Venmo payments would land in
  Trad Tech's account, not the agency's. That breaks the rule that money
  goes straight to the agency, and holding agencies' money is a
  money-transmitter problem. It can't ship as is.
- `processVenmoPayment` also needs a signed-in agency user (customers got
  "Unauthorized") and takes the amount from the browser.
- PayPal already has a partner-referral onboarding sketch
  (`paypal-actions.ts`: `createPayPalPartnerReferral`, merchant-integration
  status checks via `PAYPAL_PARTNER_ID`). Its checkout form is a stub.

## The options
| | Venmo through PayPal's platform (recommended) | Venmo through Braintree | Agency's Venmo handle, paid offline |
| --- | --- | --- | --- |
| Where the money goes | The agency's PayPal Business account | The agency's own Braintree account, or the platform's (today's bug) | The agency's Venmo |
| What the agency needs | PayPal Business account, connected in Settings (onboarding sketch exists) | Its own Braintree merchant account (underwriting) plus API keys given to us, or Braintree Marketplace/Auth | Nothing |
| Also gives PayPal | Yes: one button set shows PayPal, Venmo (US) and Pay Later | No | No |
| Platform fee | `platform_fees` on the order, **only once PayPal enables us as a partner** | Marketplace service fee, if Marketplace accepts us | None |
| Order paid before it's saved | Yes (server creates and captures the order) | Yes | **No**: unpaid orders hold stock. Rejected before (blocker 7). |

**Recommendation: Venmo through PayPal's platform.** It's the one option where
money goes to the agency, a single build also delivers PayPal, and the
partner onboarding is half-written. Braintree per-agency accounts are a
heavy ask for solo operators. I couldn't confirm Braintree Marketplace still
takes new platforms (its docs say US-only, and Braintree Auth is "Beta").

**Decision for the owner (CLAUDE.md says the three providers are
intentional):** this routes Venmo through PayPal and retires the Braintree
code. Customers still get Venmo, PayPal and cards, but the provider count
drops from three to two. It is not a fourth provider.

**Honest friction:** a solo operator's everyday Venmo is usually a personal
@handle. Customers can pay with Venmo, but the money lands in the agency's
**PayPal Business** account, not their Venmo. Venmo's terms keep business
payments off personal accounts, and a website checkout can't pay an @handle
anyway. That needs saying plainly in Settings and in sales.

## What the owner does first (blocks everything)
1. A PayPal Business account for Trad Tech (the platform) and a REST app,
   sandbox first. The keys go in Vercel: sandbox in Preview, live in
   Production.
2. Ask PayPal to enable the account as a partner ("PayPal Complete Payments"
   / multiparty, partner fees and seller onboarding). Ask how long that
   takes; nobody here knows.
3. Decide: approve retiring Braintree (above)?

## Build, once 1-3 are done (each its own PR, tested in PayPal sandbox)
1. **Connect:** finish the partner-referral onboarding. Store the agency's
   PayPal merchant id; count "PayPal ready" as a payment path in
   `bookingBlockers` (`features/agency/readiness.ts`). Check tenant scoping
   on every query.
2. **Checkout:** the server creates the PayPal order from the server total
   (never the browser's), payee = the agency's merchant id, platform fee
   when enabled. The PayPal JS SDK shows PayPal and Venmo buttons. The
   server captures, then `createOrderFromPayload()` with method `paypal` or
   `venmo` (from the capture's payment source). Same `booking_checkouts`
   pattern as Stripe (a `provider` column), with the same hold and
   refund-on-failure rules, and alerts.
3. **Refunds and webhooks:** refund on cancel through PayPal (with the
   agency's auth assertion); a webhook mirrors refunds made in PayPal.
4. **Remove** the Braintree code and its Settings tab; the PayPal tab
   becomes "PayPal and Venmo".

Size: about as big as Stripe milestones 2a + 2b together.

Sources: [PayPal multiparty platforms](https://developer.paypal.com/docs/multiparty/),
[Braintree Marketplace](https://developer.paypal.com/braintree/docs/guides/braintree-marketplace/overview).
