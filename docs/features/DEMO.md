# Demo environment

Status: **PLANNED** (owner + Claude, 2026-10-29). Not built. Waits on
Supabase Pro and Vercel Pro (see Prerequisites).

## Goal
Let a prospective agency use the real product, the dashboard and their own
booking page, without touching real data, real money or real accounts, and
without anyone switching settings on or off. First use: the owner's pitches
(Victory Store and agencies). Each demo starts as a 15-minute guided walk-through,
then the prospect explores on their own for the rest of the demo period.

## Decisions
- **Address: `demo.yardcard-elite.com`**, not a second domain. Free (DNS
  is already in Vercel), reads as the official product. Nothing in the app
  routes by subdomain (the middleware only passes it along as a header), so
  `demo.` is just an address.
- **Its own Supabase project.** Previews share production's database; a
  demo must not write fake agencies and orders next to real ones (and the
  production crons would trip over them). The demo database holds the
  template agency, every prospect's copy, and the leads list.
- **Sandbox everything else, by environment variables only:** Stripe
  sandbox keys and webhooks, Clerk's development instance, Resend. The
  same code as production, so the demo shows the real product.
- **Each prospect gets their own copy of a template agency**, not a shared
  one: two prospects at once would see each other's bookings, and resetting
  one would wipe the other mid-session.
- **Sign-in is our own front door, Clerk behind it:** email plus access
  code on our page, our email through Resend, then a Clerk sign-in ticket.
  The dashboard and its agency checks stay untouched.

### Rejected, and why
- **A second domain:** costs yearly, needs its own email/sign-in/SSL setup,
  looks like a different product.
- **Saving only in the browser:** holds, availability, orders and payments
  are server-side, so it means a second, fake backend (like `/lab`, which
  can't reach payments); the demo would stop matching the product, and a
  booking made on a phone wouldn't appear on the laptop's dashboard.
- **Supabase Auth for the demo:** Clerk runs through the middleware, every
  page guard (`requireAgencyPage`), server actions and API routes. With RLS
  off, those guards are the only tenant isolation; rewriting all of them to
  understand two auth systems risks a production data leak to serve the
  demo, and means maintaining both forever.
- **Production Clerk on the demo:** a prospect who later signs up for real
  with the same email would share one Clerk account, and the demo cleanup
  would delete their real account.

## Flow
1. The owner sends a link to `demo.yardcard-elite.com`, or opens it in
   the meeting.
2. The prospect types their email and agrees to the line *"We'll email your
   demo code and occasional YardCard Elite news."*
3. We email an **access code** (Resend, our branding). The code is good for
   the whole demo period: signing in again on a phone with the same code
   works until it expires.
4. Entering the code: the server checks it, creates the prospect's demo
   agency from the template (first time only), creates or finds their Clerk
   user, and signs them in with a one-time Clerk sign-in ticket (the same
   mechanism the test scripts use).
5. They land in the real dashboard with a **demo banner** ("Demo - nothing
   here is real") and a countdown to the end of the period.
6. Their booking page is live at `demo.yardcard-elite.com/<their-slug>/booking`
   and shows the test card (4242 4242 4242 4242) on screen. Booking a display
   sends both emails to the prospect: the agency's "New booking" and the
   customer's confirmation.
7. When the period ends, the dashboard shows "Your demo has ended" with a
   button to start a new one.

## Template agency
Lucky Lawn Signs (the name used in the marketing mockup and sample emails):
- full placeholder sign library in stock (20 of each, like the test agencies);
- a handful of sample orders across the week (upcoming, deployed, completed)
  so the order board and home page aren't empty;
- prices, booking rules and white label set, Elite plan, Stripe "connected"
  to a sandbox account so the booking page is open.

The copy step duplicates the agency row, its inventory and sample orders
with fresh ids and a unique slug (e.g. `lucky-lawn-x7k2`), owned by the
prospect's user.

## Expiry and cleanup
- Each copy has `expires_at` (the demo period: 1, 4 or 24 hours; one
  setting, default to be decided).
- The dashboard checks it on every page (with the demo banner) and shows
  the ended screen once it passes.
- A cleanup job (Vercel cron in the demo environment) deletes, one by one:
  the Clerk user (Clerk has no bulk delete), the copied agency with its
  orders, holds and inventory, and the `users` row. It **keeps the email**
  in the leads list.
- This runs only against the demo database, so it can never reach real data.

## Leads
- Table `demo_leads` (demo database, RLS on): email, consent text shown,
  first demo, demo count, last demo.
- Marketing email needs an unsubscribe link and our identity (CAN-SPAM); the
  privacy policy draft needs a line about demo emails before the demo opens.

## Limits to know
- **Clerk development instance:** about 100 users at once (Clerk's August
  2024 notice; check the current figure before building). Cleanup frees
  slots, and guided demos won't come near it. Clerk's own emails say
  "development", but we send the code ourselves, so prospects don't see that.
- **Sign-in endpoint:** rate-limit code requests per email and per IP
  (no email bombing); store codes hashed; 6+ characters.
- **Stripe sandbox:** webhooks must point at the demo address. Test charges
  never move money.

## Prerequisites
1. **Supabase Pro** (the org has 2 free projects, both in use) and a new
   project for the demo, with the YCE schema applied. A baseline migration
   (STATE.md, parked item 8) makes that one step instead of replaying history.
2. **Vercel Pro** (also a launch blocker: Hobby forbids commercial use), then
   a "Demo" custom environment that follows main with its own variables
   (demo database, Stripe sandbox, Clerk development, Resend). Without Pro:
   a `demo` branch with branch-scoped variables, merged from main each release.
3. DNS: `demo.yardcard-elite.com` pointed at that environment.

## Build, roughly two sessions
1. Demo environment, database and DNS; seed the template agency.
2. Access-code page, code email, code check plus agency copy plus Clerk ticket.
3. Demo banner and countdown, ended screen, test-card hint on the booking page.
4. Cleanup cron and leads table.
5. Run a full demo end to end on a phone and a laptop.

## Open questions (owner)
- Default demo period: 1, 4 or 24 hours?
- Does a returning prospect get a fresh copy, or their old one if it hasn't
  expired? (Proposed: the old one until it expires, then fresh.)
- Who else can start a demo: anyone with the link, or only people the owner
  invites (an invite list in `demo_leads`)?
