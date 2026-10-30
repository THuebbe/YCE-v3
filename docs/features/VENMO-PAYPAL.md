# Venmo and PayPal at checkout

Status: **PLANNED: after Victory Store, before go-live (recorded 2026-10-19)**. Not at launch.

- Today customers are only offered Stripe cards; the Venmo and PayPal setup
  tabs in Settings still work.
- Why they aren't real yet (STATE.md, go-live blocker 7): Venmo's
  `processVenmoPayment` requires a signed-in agency user (customers got
  "Unauthorized") and takes the amount from the browser; PayPal's form is a
  stub. Both used to save unpaid orders.
- Building them is a milestone of its own. No fourth provider (CLAUDE.md).
