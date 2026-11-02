-- Prisma used to fill in `id` (cuid) and `updated_at` itself. Since it was
-- removed, any insert that leaves them out fails with a not-null error.
-- Found 2026-11-02: Signs > Library "Add" (agency_inventory) and custom sign
-- upload (sign_library) failed for every agency.
--
-- Defaults only: existing rows and inserts that set these columns are
-- unchanged. New ids are uuid text (ids are text; old rows keep their cuids).
-- YCE tables only: users (shared with PantryPro) and PantryPro's tables are
-- left alone.
-- APPLIED 2026-11-02 to production (YCEv3) and yce-demo.

alter table public.agencies              alter column id set default gen_random_uuid()::text;
alter table public.agencies              alter column updated_at set default now();
alter table public.agency_inventory      alter column id set default gen_random_uuid()::text;
alter table public.agency_inventory      alter column updated_at set default now();
alter table public.sign_library          alter column id set default gen_random_uuid()::text;
alter table public.sign_library          alter column updated_at set default now();
alter table public.inventory_holds       alter column id set default gen_random_uuid()::text;
alter table public.inventory_hold_items  alter column id set default gen_random_uuid()::text;
alter table public.orders                alter column updated_at set default now();
alter table public.order_items           alter column id set default gen_random_uuid()::text;
alter table public.order_signs           alter column id set default gen_random_uuid()::text;
alter table public.order_activities      alter column id set default gen_random_uuid()::text;
alter table public.sign_check_ins        alter column id set default gen_random_uuid()::text;
