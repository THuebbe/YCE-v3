-- APPLIED 2026-10-21 at the switch to Stripe live. DO NOT RUN AGAIN: it would
-- disconnect every agency from Stripe and cancel their plan in our records.
-- Kept here as the record of what was done (the file was left on a branch
-- that never merged; added to main 2026-10-22). Backup of the cleared values:
-- table yce_agencies_stripe_sandbox_backup_20261021.
--
-- Stripe goes live (2026-10-21): every agency's Stripe IDs point at the
-- SANDBOX (connected accounts, customers, subscriptions). In live mode they
-- don't exist, so clear them; each agency reconnects Stripe and subscribes
-- again (the owner's agency with promo code TRADTECH-INTERNAL, the tester
-- with FOUNDINGTESTER).
--
-- Run ONLY at the switch, in the same sitting as the live keys going into
-- Vercel Production. UPDATE only - no rows are deleted. Booking pages close
-- until each agency is paid up and connected again (readiness.ts).
--
-- Not reverted: sandbox orders keep their sandbox payment records, so a
-- sandbox order can't be refunded with the live key any more (cancel it
-- with "no refund").

update public.agencies set
  stripe_account_id = null,
  stripe_account_status = null,
  stripe_account_type = null,
  stripe_connect_status = 'pending',
  stripe_charges_enabled = false,
  stripe_payouts_enabled = false,
  stripe_details_submitted = false,
  stripe_onboarding_url = null,
  stripe_customer_id = null,
  stripe_subscription_id = null,
  subscription_status = 'none',
  subscription_price = null,
  subscription_trial_end = null,
  subscription_current_period_end = null,
  subscription_cancel_at_period_end = false,
  subscription_past_due_since = null,
  subscription_synced_at = null,
  plan = 'essentials'
where stripe_account_id is not null
   or stripe_customer_id is not null
   or stripe_subscription_id is not null
   or subscription_status <> 'none';
