-- orders: snake_case for the three Prisma-era columns that hold data
-- (APPLIED 2026-10-30 via the Supabase MCP; re-copy below re-run after the
-- code PR deployed - see STATE.md).
--
-- Of orders' 21 camelCase columns, only these hold data:
--   "extraDaysBefore", "extraDaysAfter"  (every row)
--   "holdId"                             (31 rows)
-- The code now reads and writes the snake_case columns added here. The 18
-- empty camelCase columns and the empty lowercase `confirmationcode` are
-- dropped later by 20261030_orders_drop_camelcase_columns.sql, run by the
-- owner once nothing has touched them for a day.
--
-- Additive and re-runnable: safe while old code still writes the old names.

alter table public.orders
  add column if not exists extra_days_before integer not null default 0,
  add column if not exists extra_days_after integer not null default 0,
  add column if not exists hold_id text;

-- Copy (and re-copy after deploy, for any order the old code wrote meanwhile)
update public.orders set
  extra_days_before = coalesce("extraDaysBefore", 0),
  extra_days_after  = coalesce("extraDaysAfter", 0),
  hold_id           = coalesce(hold_id, "holdId")
where extra_days_before is distinct from coalesce("extraDaysBefore", 0)
   or extra_days_after  is distinct from coalesce("extraDaysAfter", 0)
   or (hold_id is null and "holdId" is not null);
