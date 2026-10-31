-- DEMO DATABASE ONLY (yce-demo). Never run on production.
-- Makes the 5 loaners bookable: each gets its own Stripe SANDBOX connected
-- account (stripe_account_id is unique) and a stand-in subscription.
--
-- Accounts (sandbox, platform acct_1REKSs2Hwl27rYJO):
--   1, 2: already onboarded, charges enabled (also used by test agencies in
--         the production database's previews; harmless, separate database)
--   3-5:  created 2026-10-31 with Stripe test data; each needs its terms
--         accepted once through an onboarding link. The demo site's webhook
--         (account.updated) flips stripe_charges_enabled when that happens.
--
-- Subscriptions: 'demo_sub_N' is not a Stripe id. Demo mode skips the
-- subscription sync cron and the billing portal (see src/features/demo).

update public.agencies a
set stripe_account_id = v.acct,
    stripe_account_type = 'express',
    stripe_account_status = case when v.enabled then 'enabled' else 'pending' end,
    stripe_charges_enabled = v.enabled,
    stripe_payouts_enabled = v.enabled,
    stripe_details_submitted = v.enabled,
    stripe_subscription_id = 'demo_sub_' || v.n,
    subscription_status = 'active',
    subscription_current_period_end = now() + interval '10 years',
    subscription_cancel_at_period_end = false,
    updated_at = now()
from (values
  (1, 'acct_1URY21CAFUeJ6RMe', true),
  (2, 'acct_1URjHtFl2xMJRcZS', true),
  (3, 'acct_1UWSn8FggmUq2zoZ', false),
  (4, 'acct_1UWSoTFreiOa5n7g', false),
  (5, 'acct_1UWSoWCDB0fYhoOh', false)
) as v(n, acct, enabled)
where a.id = 'demo_loaner_' || v.n;
