-- orders: drop the Prisma-era camelCase columns. NOT APPLIED: the owner runs
-- this in the Supabase SQL editor (CLAUDE.md rule 5: DROPs wait for the owner).
--
-- Run it only when all of these hold (STATE.md has the status):
--   1. The orders casing PR is merged and deployed.
--   2. 20261030_orders_snake_case_columns.sql was re-run after that deploy.
--   3. At least a day has passed and this returns no rows (no query has
--      touched the old names since the stats were reset):
--        select query from pg_stat_statements
--        where query ~ '"(extraDays|holdId|timeWindow|delivery[A-Z]|confirmationCode|paymentIntentId)'
--          and query !~ 'pg_stat_statements';
--
-- Every column below was empty or copied to its snake_case twin (checked
-- 2026-10-30: 387 orders; only extraDaysBefore/After and holdId held data).
-- No function, view, trigger or policy references them.

begin;

-- Last guard: abort if the copies don't match
do $$
begin
  if exists (
    select 1 from public.orders
    where extra_days_before is distinct from coalesce("extraDaysBefore", 0)
       or extra_days_after  is distinct from coalesce("extraDaysAfter", 0)
       or ("holdId" is not null and hold_id is distinct from "holdId")
  ) then
    raise exception 'orders: snake_case copies are out of date - re-run 20261030_orders_snake_case_columns.sql first';
  end if;
end $$;

alter table public.orders
  drop column if exists "confirmationCode",
  drop column if exists confirmationcode,
  drop column if exists "deliveryStreet",
  drop column if exists "deliveryCity",
  drop column if exists "deliveryState",
  drop column if exists "deliveryZipCode",
  drop column if exists "timeWindow",
  drop column if exists "deliveryNotes",
  drop column if exists "eventMessage",
  drop column if exists "customMessage",
  drop column if exists "recipientName",
  drop column if exists "eventNumber",
  drop column if exists "messageStyle",
  drop column if exists "nameStyle",
  drop column if exists "characterTheme",
  drop column if exists "extraDaysBefore",
  drop column if exists "extraDaysAfter",
  drop column if exists "paymentMethod",
  drop column if exists "paymentMethodId",
  drop column if exists "billingZipCode",
  drop column if exists "holdId",
  drop column if exists "paymentIntentId";

commit;
