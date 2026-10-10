# YardCard Elite v3

Multi-tenant SaaS for yard card rental agencies: agencies manage sign
inventory and orders; their customers book through a public booking
wizard at `/<agency-slug>/booking`.

**Start with these, not this file:**
- `CLAUDE.md` - stack, non-obvious rules (RLS is off, shared database,
  column casing, migrations), conventions
- `STATE.md` - what works today, what's verified, what's next
- `PRODUCT.md` - business rules and decisions (the "why")
- `ARCHITECTURE.md` - how the pieces fit (holds, availability, pricing)

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Clerk
(auth) · Supabase Postgres (data, service-role client, server-only) ·
Stripe / Braintree (Venmo) / PayPal · Vercel Blob (documents) · Resend
(email) · Vercel (hosting). Package manager: **pnpm**.

## Local development
```bash
pnpm install
pnpm dev        # http://localhost:3000/<agency-slug>/booking
```
There is no `.env.example` yet. Put these in `.env.local` (names from
the code; ask the project owner for values):

| Needed for | Variables |
|---|---|
| Database | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Auth | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| Documents | `BLOB_READ_WRITE_TOKEN` |
| Email | `RESEND_API_KEY` (without it, orders don't email) |
| Crons | `CRON_SECRET` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BRAINTREE_*`, `PAYPAL_*` |
| URLs | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` |

## Database changes
SQL lives in `migrations/` and is **not** applied automatically - see
CLAUDE.md rule 5. There is no committed baseline schema.
