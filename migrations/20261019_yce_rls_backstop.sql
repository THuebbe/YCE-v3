-- Backstop: the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY, shipped to
-- browsers for file uploads) could read AND write every YCE table through
-- Supabase's REST API, because RLS was off: customer names, addresses and
-- phones in orders, agency payment settings, inventory.
--
-- RLS on with NO policies = the anon and authenticated roles get nothing.
-- The app is unaffected: its only database client is the service role
-- (src/lib/db/supabase-client.ts), which bypasses RLS. Tenant isolation is
-- still the app's job (CLAUDE.md rule 2); this only shuts the side door.
--
-- YCE-only tables. NOT here, decision for the user: `users` (shared with
-- PantryPro) and PantryPro's own tables - PantryPro may use the anon key.
-- booking_checkouts already had RLS on.
alter table agencies enable row level security;
alter table agency_inventory enable row level security;
alter table sign_library enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_signs enable row level security;
alter table order_activities enable row level security;
alter table sign_check_ins enable row level security;
alter table inventory_holds enable row level security;
alter table inventory_hold_items enable row level security;
alter table bundles enable row level security;
alter table transactions enable row level security;
