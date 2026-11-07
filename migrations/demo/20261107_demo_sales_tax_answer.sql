-- yce-demo only. Booking pages stay closed until the agency answers the sales
-- tax question (2026-11-07). Lucky Lawn answers "no sales tax"; loaners are
-- reset from the template, so they get it too. Prospects can change it in
-- Settings > Booking page.
-- APPLIED 2026-11-07 to yce-demo.

update public.agencies
set pricing_config = coalesce(pricing_config, '{}'::jsonb) || '{"salesTaxRate": 0, "salesTaxIncluded": false}'::jsonb,
    updated_at = now()::timestamp
where id = 'demo_template_lucky_lawn' or id like 'demo_loaner_%';
