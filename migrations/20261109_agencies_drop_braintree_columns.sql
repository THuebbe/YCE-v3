-- agencies: drop the Braintree/Venmo columns. NOT APPLIED: the owner runs
-- this in the Supabase SQL editor, on production (YCEv3) and on yce-demo
-- (CLAUDE.md rule 5: DROPs wait for the owner).
--
-- Why: Braintree is retired (owner, 2026-11-09). Venmo comes through PayPal
-- (docs/features/VENMO-PAYPAL.md). The Braintree code saved the platform's
-- own merchant id on every agency, so it could never ship.
--
-- Checked 2026-11-09 on production: no agency has a merchant id or any key;
-- the filled columns hold only defaults ('not_connected', 'sandbox', ...).
-- No function or view uses them; their 4 indexes and 3 check constraints go
-- with the columns. No code reads them after the Braintree removal PR.
-- Run it only after that PR is deployed.

begin;

-- Last guard: abort if anything real was ever saved
do $$
begin
  if exists (
    select 1 from public.agencies
    where braintree_merchant_id is not null
       or braintree_private_key is not null
       or braintree_public_key is not null
       or venmo_enabled is true
  ) then
    raise exception 'agencies: Braintree data found - stop and check before dropping';
  end if;
end $$;

alter table public.agencies
  drop column if exists braintree_account_status,
  drop column if exists braintree_configuration,
  drop column if exists braintree_created_at,
  drop column if exists braintree_environment,
  drop column if exists braintree_integration_data,
  drop column if exists braintree_last_sync_at,
  drop column if exists braintree_merchant_id,
  drop column if exists braintree_private_key,
  drop column if exists braintree_public_key,
  drop column if exists braintree_webhook_endpoint,
  drop column if exists braintree_webhook_signature,
  drop column if exists venmo_allow_desktop,
  drop column if exists venmo_allow_web_login,
  drop column if exists venmo_enabled,
  drop column if exists venmo_payment_method_usage;

commit;
