# YardCard Elite v3 — Agent Orientation

Multi-tenant SaaS for yard card rental agencies. Agencies manage sign
inventory and orders; their customers book displays through a public
booking wizard scoped to the agency.

## Stack
- Next.js 15.3.4 (App Router), React 19, TypeScript, Tailwind v4
- **Auth: Clerk.** Not Supabase Auth. `auth.uid()` is ALWAYS null here.
- **Data: Supabase (Postgres).** Not Prisma — the README is stale.
- Payments: Stripe, Braintree/Venmo, PayPal — all three intentional
  (target users are solo operators; some take Venmo, some PayPal,
  some have real Stripe accounts). Do not "simplify" this.
- Deploy: Vercel. Package manager: **pnpm** (never npm)
- Local dev: `pnpm dev`, then `http://localhost:3000/<agency-slug>/booking`

## Non-obvious rules — read before writing queries
1. **The only Supabase client is service-role and server-only**
   (`src/lib/db/supabase-client.ts`). Never import it into a
   `'use client'` component. Verified: no client component does today.
2. **RLS is OFF on every YCE table.** Tenant isolation is enforced
   ONLY in application code. Every query against a tenant-scoped table
   MUST filter on the agency. **Don't assume the column name** —
   `orders` and `agency_inventory` both use `agency_id` (verified against
   live app code and the database; this file previously said `orders`
   used `"agencyId"`, which was wrong). Casing has varied historically
   on other tables, so check the actual column; do not assume. There is
   no database backstop. A missing filter is a data leak.
3. **The database is shared with a second product (PantryPro).**
   45 tables in `public`; ~25 are PantryPro (`restaurants`, `vendors`,
   `pos_*`, `recipe_*`, `menu_items`, `waste_log`...).
   **`users` is shared by BOTH products.** Never write a migration
   that assumes a single tenant model. Splitting them is a planned
   future project — don't start it mid-task.
4. **Column casing is inconsistent and it's historical, not random.**
   The project began on Prisma and it was removed early for causing
   more trouble than it solved. IDs are still cuids. Prisma-era columns
   are `"camelCase"`; hand-written post-Prisma SQL is `snake_case`. The
   `agencies` table has both. Always check the real column name.
   **Anything still referencing Prisma is a deprecated relic — delete
   it, don't work around it.**
5. **Migrations in `migrations/` are NOT auto-applied.** They are run
   by hand in the Supabase SQL editor. Schema drift between repo and
   database has already caused two outages. If you add a migration,
   say explicitly that it must be run manually.
6. **Pricing is per-agency and lives in `agencies.pricing_config`**
   (JSONB: `basePrice`, `extraDayPrice`, `lateFee`). The agency settings
   UI and `/api/agency/financial-settings` read and write it correctly.
   The BOOKING WIZARD DOES NOT — it hardcodes `basePrice = 95` in four
   step components. Never add another hardcoded price.
7. Do not add a fourth payment provider.

## Two `Sign` types exist. This is deliberate.
- `src/features/inventory/types.ts` — persistence model, mirrors the
  `sign_library` row (`is_platform`, `size_width`, `image_url`)
- `src/features/booking/types.ts` — runtime/view model with fields no
  single table holds (`availableQuantity` needs an `agency_inventory`
  join; `zone`, `character`, `isOrdinal`, `style` are configurator-only)
Entity vs DTO. Don't merge them. What's missing is an explicit adapter.

## Conventions
- Features in `src/features/<domain>/`; routes in `src/app/`
- Server actions in `features/<domain>/actions.ts`
- Zod schema per wizard step in `features/booking/types.ts`
- Tenant routes are `src/app/[agency]/...`

## Working style
Show the plan before writing code. Challenge decisions rather than
implementing them silently. Flag scope creep — this project's failure
mode is starting new work, not finishing existing work. Explain by
analogy where it helps.
