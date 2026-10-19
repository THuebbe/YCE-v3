-- Milestone 3, chunk 2: agency subscriptions (Stripe Billing on the
-- platform account, separate from Connect). The webhook and a daily cron
-- mirror each agency's Stripe subscription onto these columns;
-- features/billing/subscription.ts decides from them whether the agency's
-- booking page is open.
alter table agencies
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_price text,            -- Stripe price lookup_key, e.g. yce_elite_monthly
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_trial_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists subscription_past_due_since timestamptz, -- start of the 7-day grace
  add column if not exists subscription_synced_at timestamptz;

create unique index if not exists agencies_stripe_subscription_id_key
  on agencies (stripe_subscription_id) where stripe_subscription_id is not null;
create unique index if not exists agencies_stripe_customer_id_key
  on agencies (stripe_customer_id) where stripe_customer_id is not null;

-- subscription_status held made-up values ('active', 'trial') from before
-- billing existed. From now on it holds a Stripe subscription status, or
-- 'none' before the agency has subscribed (the column is NOT NULL).
alter table agencies alter column subscription_status set default 'none';
update agencies set subscription_status = 'none' where stripe_subscription_id is null;
