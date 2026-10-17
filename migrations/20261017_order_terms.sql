-- Milestone 2a: booking terms consent on each order.
-- Applied by Claude via the Supabase MCP (see CLAUDE.md rule 5).
--
-- The customer ticks "I agree" to the agency's booking terms on the Review
-- step (consent for later late/damage charges; chargeback evidence). The
-- server saves when, and the exact text it built from the agency's settings.
-- Nullable: orders from before this column, and agency-created ones, have none.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_snapshot jsonb;
