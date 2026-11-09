# Booking through AI agents

Status: **IDEA, back burner (owner, 2026-11-09).** Not at launch. What *is*
in scope now: the booking page works for browser-using agents (see below).

## Why
More people ask an assistant to do errands for them ("put a birthday yard
sign up Saturday"). An agency whose booking page an agent can complete gets
those bookings; a page an agent can't finish loses them.

## Phase 1, now: agent-friendly booking page
Browser agents read the page's accessibility tree, so this is mostly
accessibility work that helps people too: every control named, dates
readable as dates, no step that only works by sight, clear errors. Audited
and fixed as its own work; see STATE.md.

## Phase 2, later: an MCP server / booking API
Tools for an agent to: find the agency, check available dates for a
message, get a quote, and hold the signs. **Payment stays with the person**:
the agent ends by sending a payment link (Stripe Checkout on the agency's
account) for them to approve. Agents can't type cards into Stripe's form,
and the customer usually wants to see the display before paying.

Open questions before building:
- Demand: do any customers actually book this way? Ask in operator
  interviews.
- Abuse: automated bookings tying up letters with holds (hold expiry helps;
  rate limits needed).
- PRODUCT.md lists "public API" as a non-goal until after launch.
