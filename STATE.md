# Where This Stands

Last verified: 2026-09-14. Booking wizard clicked through live end to end
(Contact Info → fully-rendered Payment step); authenticated dashboard
login clicked through live for the first time this dormancy —
admin@elite-denver.com signed in via Clerk and reached the real dashboard.
Two wizard dead ends found and fixed live in-browser same day: the Zone
3/4 fill gate, and an Event Details date field that silently blocked
Continue. Supabase project was PAUSED; restored 2026-09-10. Free tier
re-pauses after ~7 days idle.

## VERIFIED WORKING (seen running, not inferred)
- `pnpm install` + `pnpm dev` boots clean. Ready in ~6s.
- Booking wizard steps 1-3 work end to end.
- **The five-zone layout engine works.** Ordinal insertion works.
- Agency lookup by slug works (`elite-denver` → cmcpperej000fq8br24m5cd06).
- Clerk middleware runs; subdomain parsing works on `.localhost`.
- **Fixed 2026-09-14: dashboard login never worked for manually-seeded
  users.** `getUserById()` matched `users.id` against the Clerk auth ID,
  which only lines up for users created via the live signup webhook.
  Seeded users (`scripts/sync-clerk-users.ts`) keep a cuid `id` and store
  the Clerk id in `clerk_user_id` instead — a column never queried.
  Fixed with `.or('id.eq.<id>,clerk_user_id.eq.<id>')` in the one
  function 18 files depend on. Confirmed with a real Clerk sign-in.
- **Payment step works — clicked through, not just schema-checked.**
  2026-09-12 PayPal migration added columns in camelCase while app code
  reads snake_case (same failure shape as the original braintree bug).
  Fixed via `migrations/20260912_rename_paypal_columns_to_snake_case.sql`
  (run by hand in Supabase SQL editor). Zero PantryPro blast radius.
- **Fixed 2026-09-14: Zone 3/4 fill gate blocked ordinary checkout
  inputs.** Real bug wasn't the documented 60%-vs-75% threshold mismatch
  but that zone3's available margin (`zone1.totalWidth - zone2.totalWidth`)
  went to 0 whenever the message and recipient name were similar
  lengths (e.g. "Happy Birthday"/"Test Recipient") — 0% fill, gate never
  passed, checkout unreachable. Rebuilt `calculateZone3AndZone4()` in
  `layout-calculator.ts`: each side now always gets a guaranteed minimum
  of 1 background + 2 decoration signs, then grows to 75% fill, accepting
  overshoot rather than trimming back. Decorations now chosen by real
  hobby-keyword matching (`decorationCatalog`/`rankDecorationsByHobbies`)
  instead of stamping the raw hobby string on screen. Verified live:
  entered the exact broken case on `/elite-denver/booking`, got "Zone 3
  fill: 100%", a reserved hold, and an enabled "Continue to Payment".
- **Fixed 2026-09-14: Event Details silently dead-ended if the customer
  didn't touch the Event Date field.** Default was `Date.now() + 48h`
  captured once at mount, but `eventSchema`'s Zod refine
  (`types.ts:19-26`) re-checks "48h from now" on every validation pass —
  so the untouched default failed the instant any time passed after
  mount, essentially always. `Continue` is `disabled={!isValid}`, so it
  just sat disabled with zero visible error (the handler that would show
  `errors.eventDate` can't run behind a disabled button). Fixed by
  bumping the default to `+72h` — real margin above the 48h minimum,
  which the `min` attribute and Zod refine still enforce unchanged.
  Verified live: filled the form leaving the date untouched, waited 8s,
  confirmed Continue enabled and advanced cleanly with no manual nudge.
- Minor: the event-date field is date-only (no time), so "48 hours from
  now" can reject a date exactly 2 calendar days out before midnight.
  Pick 3+ days out when testing manually.
- **Fixed 2026-09-16 (`742320c`): real letter/number/punctuation PNGs
  render in Zone 1/2**, not colored boxes — `layout-calculator.ts`
  resolves each character against the manifest for the chosen
  style/colorway; a new colorway picker and a manifest-driven Style radio
  replaced the old hardcoded/mismatched options.
  **Fixed 2026-09-16 (`e41f821`): Zone 3 renders real heart/star art**
  when the decoration ranking picks them — `rankDecorationsByHobbies` no
  longer drops zero-score candidates, so real-art decorations stay
  reachable instead of excluded outright. Design details, and the larger
  "smart configurator" (Theme/Style/Color/Hobby) design this led into,
  are in `ARCHITECTURE.md` (`Smart configurator ... — DESIGNED, NOT
  BUILT`) — DB work (sign_library schema for letters, per-agency
  inventory seed) is the explicit blocker, not yet started.
- **Dead end, recorded so it isn't repeated:** a `/routing` ↔ `/auth/sign-in`
  redirect loop hit while testing the login fix was NOT a code bug — the
  dev machine's clock was ~45-60s behind real time, so every fresh Clerk
  session token's `nbf` claim looked "not valid yet" forever (confirmed
  via HAR: `x-clerk-auth-reason: session-token-nbf`). Fixed by resyncing
  the OS clock; nothing in the repo changed. `/routing`'s auto-redirect
  is a known-flaky `setTimeout` hack (already TODO'd) and still needed a
  manual fallback click even post-fix — pre-existing, not caused by this.

## VERIFIED BROKEN
0. **Typing digits directly into the Event Date field can crash the
   whole Event Details step.** Automated keystrokes (e.g. typing
   `09202026` digit by digit) can leave the native `<input type=date>`
   momentarily invalid; `formatDateForInput()` then calls
   `.toISOString()` on an Invalid Date → `RangeError: Invalid time
   value`, caught by a React error boundary but the step's local state
   is lost. Found 2026-09-14 alongside the date-staleness bug (now
   fixed) — this one is separate and still open. Clicking the native
   calendar picker can't produce this state; risk is manual typing.
1. **Inventory holds are `localStorage`**, not the real `inventory_holds`
   tables the agency side already uses (`features/inventory/actions.ts`).
   Two customers can reserve the same letters; holds die on device switch;
   `api/cron/clear-expired-holds` can't run (no `localStorage` server-side).
2. **Subdomain URLs 404 in dev**; middleware detects the subdomain but
   never rewrites the path. Use path-based URLs (`/elite-denver/booking`).
3. **Every `.vercel.app` deploy breaks the same way** — `getSubdomain`
   misreads the deploy hostname as an agency slug. Needs an early
   `if (host.endsWith('.vercel.app')) return null`.
4. **`getAvailableSigns()` is manifest-backed, not Supabase-backed.**
   Fixed 2026-09-16 to read from `manifestSignSource` (real PNG assets)
   instead of pure hardcoded mock letters, via an injectable `SignSource`
   default — but it's still not real per-agency inventory: every agency
   gets the same 315 assets with the same fake `availableQuantity: 99`.
   Supabase import is still commented out.
5. **`layout-calculator.ts` never consults inventory** — can promise
   letters the agency doesn't own.
6. **Wizard ignores per-agency pricing.** `basePrice = 95` hardcoded in
   four step components despite `agencies.pricing_config` existing and
   being correct (six agencies charge $81-$111). Fix: fetch on wizard
   load like payment-methods, read from context.
7. **`sign_library` has no letters** — all pre-made message boards plus
   unrelated real-estate seed data, `rental_price` 0 everywhere.
   `agency_inventory` is populated correctly for elite-denver, just not
   for letters. Seed from the sign-assets manifest before wiring
   `getAvailableSigns()` to real inventory.

## Placeholder assets — installed and wired
315 transparent PNGs (A-Z, 0-9, punctuation, heart, star × 7 colorways),
OFL/Apache fonts, nothing derived from vendor imagery, at
`public/sign-assets/` (generator: `tools/sign-generator/`). Resolver
(`sign-assets.ts`) is wired into `layout-calculator.ts` as of 2026-09-16
(see VERIFIED WORKING) — no longer just generated-and-waiting. Only 1 of
the generator's 4 font styles (`classic`) was ever actually rendered to
PNGs; the Style radio reflects that (one real option) rather than the
stale 4-option list it used to show.

## Known, deliberately deferred
- RLS off on all YCE tables — before first paying agency, not before demo.
- PantryPro's `pos_sales`/`pos_sales_items`/`pos_import_history`/
  `inventory_deductions` have RLS on with no working policies (key off
  `auth.uid()`, null under Clerk) — effectively locked. Didn't cause the
  YCE stall.
- **DECISION: split the shared DB into two Supabase projects, normalize
  casing — TRIGGER: first paying agency, or PantryPro resuming, whichever
  first.** Not now: 45-table migration, rewrites in two codebases, a
  breakage window. Shared schema hasn't broken anything on the path to demo.
- Custom domain expired; `.vercel.app` still serves.
- 305 `console.log`, 72 `any`, 3 test files across 33.6k LOC.
- No `.env.example`. No baseline schema migration committed.
- Single Stake package tier designed, never built; `bundles` +
  `bundle-creator.tsx` exist agency-side only.
- `sign-selection.ts` is a weighted-search engine for Zone 3/4 decorations
  — still unfinished, still not called from anywhere. What runs today is
  a separate, self-contained keyword-weighting implementation inside
  `layout-calculator.ts` (see VERIFIED WORKING). Candidate for deletion.

**Product direction (decided):** ship the Lettered Message configurator
first (already works); Single Stake (pre-made signs, no letters) comes
after the demo, needs `pricing_config.singleStakePrice`. `bundles` is an
inventory-purchasing concept for agencies, not a customer product.

## Next steps, in order
1. ~~Apply the three migrations~~ / ~~re-test payment end-to-end~~ /
   ~~fix the Zone 3 fill gate~~ / ~~fix the Event Details date-staleness
   dead end~~ — all done, confirmed live in browser.
2. Fix the typing-crash bug on Event Date (VERIFIED BROKEN #0) — low
   priority, real users unlikely to hit it via the calendar picker.
3. Move holds server-side onto the real `inventory_holds` tables.
4. **Seed letters into `sign_library`, then connect `getAvailableSigns()`
   to real per-agency inventory** — now the specific, well-defined
   blocker for the "smart configurator" design in `ARCHITECTURE.md`
   (`Smart configurator ... — DESIGNED, NOT BUILT`), not just a nice-to-
   have. Needs the message→theme taxonomy and per-agency seed-data
   decisions listed there before it can be built, not just the schema.
5. ~~Fix the renderer... install the PNG set~~ — done 2026-09-16, see
   VERIFIED WORKING.
6. Vendor conversation, demo in hand.

## Reference docs
- `PRODUCT.md` (repo root) — business rules, authoritative for WHY.
- Archived `technical-architecture.md`/`project-guide.md`/
  `Enhanced-TDD-Protocol.md` (workspace level) contain stale Prisma-era
  info ~9 months behind reality. **Do not implement from them.**

## NOT VERIFIED — needs investigation
- **Possible duplicate step rendering in dev.** While browser-testing
  2026-09-14, the accessibility tree repeatedly showed two full copies
  of the current step's heading/form/Continue button stacked in the DOM
  — invisible on screen (they overlap), only visible via `read_page`/DOM
  queries. Console also showed 100+ duplicate render logs for
  `contact-info-step.tsx` within ~1s of mount. Root cause unidentified —
  candidates: a framer-motion `AnimatePresence` exit-animation leak, or a
  `next dev` double-render artifact. Didn't confirm which, or whether it
  happens in production. Reproduces as early as step 1, unrelated to any
  fix made this session. Workaround: query the DOM directly for
  `disabled` state rather than trusting one accessibility-tree snapshot.

## NOT VERIFIED — check before trusting
- Whether manager@elite-denver.com / sunny-signs-ca / texas-signs /
  yardcard-elite-west-branch test users still work in Clerk.
  admin@elite-denver.com is confirmed, but its password was silently
  reset — Clerk flagged the old shared `TestPass123!` as compromised.
- Whether every tenant query truly filters on `agencyId` (unaudited).
- Whether Node 23 (non-LTS) causes issues beyond booting fine.
- Whether `basePrice = 95` was a placeholder or an intended flat rate.
