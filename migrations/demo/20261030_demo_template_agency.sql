-- DEMO DATABASE ONLY (yce-demo). The template agency every demo copies
-- (DEMO.md "Template agency"). APPLIED 2026-10-30. Idempotent.
--
-- Deliberately not here (decided 2026-10-30, see DEMO.md):
--   - Sample orders: generated per copy at demo start, relative to that day,
--     so "upcoming" never means last month.
--   - Stripe account and subscription: set on each copy by the copy step
--     (agencies.stripe_account_id is unique, so copies can't share one).
--   - Users: each copy belongs to the prospect's own user.

insert into public.agencies (
  id, name, slug, is_active, updated_at, plan, email, phone, city, address,
  description, pricing_config, booking_rules, operating_hours, policy_config,
  settings, branding, blackout_dates
) values (
  'demo_template_lucky_lawn', 'Lucky Lawn Signs', 'lucky-lawn-signs', true, now()::timestamp, 'elite',
  'hello@luckylawnsigns.example', '(319) 555-0142', 'Cedar Rapids',
  '{"street": "1200 Clover Ln", "city": "Cedar Rapids", "state": "IA", "zip": "52402"}'::jsonb,
  'Yard sign displays for birthdays, graduations and every celebration in between.',
  '{"basePrice": 95, "extraDayPrice": 15, "lateFee": 25}'::jsonb,
  '{"setupDays": 1, "teardownDays": 1, "orderCutoffDays": 1, "minimumRentalDays": 1, "maximumRentalDays": 14}'::jsonb,
  '{"timeZone": "America/Chicago"}'::jsonb,
  '{"noticeHours": 48, "feePercent": 15, "feeMinimum": 20, "damageFeePerSign": 5}'::jsonb,
  '{"serviceAreas": [{"city": "Cedar Rapids", "state": "IA"}, {"city": "Iowa City", "state": "IA"}, {"city": "Marion", "state": "IA"}]}'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb
)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, plan = excluded.plan, email = excluded.email,
  phone = excluded.phone, city = excluded.city, address = excluded.address,
  description = excluded.description, pricing_config = excluded.pricing_config,
  booking_rules = excluded.booking_rules, operating_hours = excluded.operating_hours,
  policy_config = excluded.policy_config, settings = excluded.settings, updated_at = now()::timestamp;

-- 20 of every sign in the library
insert into public.agency_inventory (id, agency_id, sign_id, quantity, available_quantity,
  allocated_quantity, deployed_quantity, updated_at)
select 'inv_' || md5('demo_template_lucky_lawn:' || s.id), 'demo_template_lucky_lawn', s.id, 20, 20, 0, 0, now()::timestamp
from public.sign_library s
where s.asset_key is not null
on conflict (agency_id, sign_id) do nothing;
