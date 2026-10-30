# Demo environment

Status: **IN PROGRESS.** Planned 2026-10-29. Database built 2026-10-30:
Supabase project `yce-demo` (`cllfpexbglmsgtnbsfkg`, us-east-2, in the Pro
org "YardCard Elite"; wake moved to the free TradTech org so the bill stays
flat), schema from `migrations/20261030_baseline_yce_schema.sql`, sign
library and template agency seeded (`migrations/demo/README.md`). Next:
Vercel "Demo" environment + DNS, then the app code (build steps 2-5).

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
- **Each prospect gets their own agency**, not a shared one: two prospects
  at once would see each other's bookings, and resetting one would wipe the
  other mid-session.
- **Loaners, not copies (owner, 2026-10-30).** A pool of 5 ready-made demo
  agencies, each with its own Clerk user and its own Stripe sandbox
  account. A prospect borrows a free one for 4 hours; it is reset from the
  template the next time it is lent. Replaces "copy the template per
  prospect, delete it after": no Clerk user created or deleted per demo
  (Clerk's ~100-user limit stops mattering), Stripe's one-account-per-agency
  rule is met once, and cleanup needs no scheduled job. The 6th prospect at
  the same moment sees "all demos are in use".
- **A loaner's sign-in can't be kept.** In demo mode the account menu is an
  "End demo" button (no profile, email or password changes), and a reset
  replaces the loaner's Clerk user, so nothing a prospect did to it carries
  over to the next one.
- **Demo links are made on the demo site's own /admin** (signed in with the
  owner's Clerk development account), so production never holds the demo
  database's keys.
- **Its own Vercel project (proposed 2026-10-30, owner deciding).** Standard
  Deployment Protection puts every preview, custom domain included, behind a
  Vercel login, so a `demo` branch preview can't serve prospects. A second
  project "yce-demo" deploying `main` as its own production: public, crons
  run, updates with every merge, separate variables. Pro bills per seat.
- **Sign-in is our own front door, Clerk behind it:** email plus access
  code on our page, our email through Resend, then a Clerk sign-in ticket.
  The dashboard and its agency checks stay untouched.
- **Invite only, by single-use link (owner, 2026-10-29).** The owner
  creates one link per prospect (`demo.yardcard-elite.com/start/<token>`).
  Only a valid, unused invite reaches the email step; the bare address
  shows "Ask us for a demo". Starting a demo spends the link.
- **A demo lasts 4 hours (owner, 2026-10-29; first said 1 hour)**, counted from sign-in. A copy
  lives only as long as its demo: a new link means a fresh sandbox, never
  the old one back. Someone who wants more time asks for a new link.

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
1. The owner creates an invite link (owner-only "Create demo link" page,
   optionally pre-filled with the prospect's email) and sends it, or opens
   it in the meeting. The usual shape: a 15-minute guided walk-through,
   then the prospect explores on their own.
2. The prospect types their email (or confirms the pre-filled one) and
   agrees to the line *"We'll email your demo code and occasional YardCard
   Elite news."* This spends the invite.
3. We email an **access code** (Resend, our branding). The code is good for
   whole 4 hours: signing in again on a phone with the same code works
   until the demo ends.
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
- prices, booking rules, policy and service areas set; Elite plan.
- Seeded 2026-10-30 (`migrations/demo/20261030_demo_template_agency.sql`):
  id `demo_template_lucky_lawn`, slug `lucky-lawn-signs`, Central time,
  $95 base / $15 extra day / $25 late fee, all 379 signs x 20.

The copy step duplicates the agency row and its inventory with fresh ids
and a unique slug (e.g. `lucky-lawn-x7k2`), owned by the prospect's user,
and then:
- **creates the sample orders** (upcoming, deployed, completed) dated around
  the day the demo starts. Decided 2026-10-30: stored sample orders would go
  stale ("upcoming" orders from last month), so the template has none.
- **gives the copy a Stripe sandbox account and a subscription.** Open
  question for build step 2: `agencies.stripe_account_id` is unique (as in
  production), so copies can't share the template's account. Options: one
  sandbox connected account created per copy through the API, or a small
  pool reused after cleanup. The booking page stays closed until it's
  solved (`bookingBlockers`: plan + payments).

## Expiry and reset (loaners)
- A lent loaner has `expires_at`: first sign-in plus 4 hours (one setting).
- The dashboard checks it on every page (with the demo banner) and shows
  the ended screen once it passes.
- Reset happens when the loaner is next lent (or when the owner ends a demo
  early): its orders, holds and checkouts deleted, settings and stock
  restored from the template, fresh sample orders dated around today, the
  agency email set to the new prospect's, and its Clerk user replaced. The
  prospect's email stays in the leads list.
- This runs only against the demo database, so it can never reach real data.

## Leads
- Table `demo_leads` (demo database, RLS on): email, consent text shown,
  first demo, demo count, last demo.
- Table `demo_invites`: token (stored hashed), optional email, created,
  used at. Single use; unused invites expire after 7 days (owner, 2026-10-30).
- Table `demo_loaners`: the 5 slots, which agency and Clerk user each is,
  free or lent, to whom, until when.
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
2. Owner-only invite page; access-code page (invite check), code email, code
   check plus agency copy plus Clerk ticket.
3. Demo banner and countdown, ended screen, test-card hint on the booking page.
4. Cleanup cron and leads table.
5. Run a full demo end to end on a phone and a laptop.

## Open questions (owner)
- Answered 2026-10-29: 4-hour demos (1 hour was too tight once the guided
  walk-through eats into it); a copy lasts only its demo (new link, fresh
  sandbox); invite-only through single-use links; links are issued from the
  admin panel.
- Answered 2026-10-30: unused invites expire after 7 days.
