-- Milestone 2a: Stripe Connect (Express + Standard) and real card checkout.
-- Applied by Claude via the Supabase MCP (see CLAUDE.md rule 5).
--
-- 1. agencies.stripe_account_type: 'express' (turnkey, $3 application fee
--    per booking) or 'standard' (agency's own Stripe, no per-booking fee).
-- 2. booking_checkouts: one row per card checkout attempt. It holds the
--    server-validated order (payload) BEFORE the charge, so the order can be
--    created exactly once after the payment succeeds - by the booking page
--    or, if the customer's browser goes away (3-D Secure, closed tab), by the
--    Stripe webhook. Status flow:
--      created -> charged -> finalizing -> completed
--                         \-> refunded (paid, but the signs couldn't be secured)
--      created -> failed (card declined / not confirmed)

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_account_type text
  CHECK (stripe_account_type IN ('express', 'standard'));

-- Accounts connected before this column existed were created as Standard
UPDATE agencies SET stripe_account_type = 'standard'
WHERE stripe_account_id IS NOT NULL AND stripe_account_type IS NULL;

CREATE TABLE IF NOT EXISTS booking_checkouts (
  id                     text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agency_id              text NOT NULL REFERENCES agencies(id),
  hold_id                text NOT NULL,
  session_id             text NOT NULL,
  stripe_account_id      text NOT NULL,
  payment_intent_id      text UNIQUE,
  amount_cents           integer NOT NULL CHECK (amount_cents > 0),
  application_fee_cents  integer NOT NULL DEFAULT 0 CHECK (application_fee_cents >= 0),
  status                 text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'charged', 'finalizing', 'completed', 'refunded', 'failed')),
  order_id               text REFERENCES orders(id),
  payload                jsonb NOT NULL,
  error                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_checkouts_agency_idx ON booking_checkouts (agency_id, created_at DESC);

-- Only the server (service role) touches this table; the anon key gets nothing
ALTER TABLE booking_checkouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON booking_checkouts FROM anon, authenticated;
