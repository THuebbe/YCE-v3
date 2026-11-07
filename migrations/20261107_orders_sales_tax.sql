-- Sales tax on bookings (owner, 2026-11-07): each agency answers in Settings
-- (pricing_config.salesTaxRate, 0 = "I don't charge it"; salesTaxIncluded),
-- and every order records what was charged.
--   subtotal      before tax
--   tax_amount    the sales tax in dollars
--   total         what the customer paid (subtotal + tax_amount)
--   tax_rate      percent at booking time (8.25), null when none
--   tax_included  the agency's prices already included the tax
-- Existing orders: no tax, so their subtotal already equals their total.
-- Additive only. APPLIED 2026-11-07 to production (YCEv3) and yce-demo.

alter table public.orders
  add column if not exists tax_amount numeric not null default 0,
  add column if not exists tax_rate numeric,
  add column if not exists tax_included boolean not null default false;
