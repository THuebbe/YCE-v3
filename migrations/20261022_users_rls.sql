-- Row level security on `users` (APPLIED 2026-10-22 via the Supabase MCP).
--
-- `users` was the one public table without RLS, so anyone holding the
-- public anon key could read every user's email and role, and change rows,
-- through the Supabase REST API. That key is public by design (it ships to
-- browsers), so this was an open door.
--
-- Shared with PantryPro. Both products reach `users` only from their
-- servers with the service-role key, which bypasses RLS, so neither app
-- changes behaviour. Checked 2026-10-22: YCE has one server-only client
-- (src/lib/db/supabase-client.ts); PantryPro's backend uses
-- SUPABASE_SERVICE_KEY and its frontend never queries Supabase directly.
--
-- PantryPro's vendor_invoices / vendor_payments policies look up
-- `users` by auth.uid(). The policy below keeps that lookup working for a
-- signed-in Supabase Auth user (they can see their own row and nothing
-- else); anon gets nothing.

alter table public.users enable row level security;

create policy users_read_own on public.users
  for select to authenticated
  using (id = (select auth.uid())::text);
