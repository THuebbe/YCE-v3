-- Late and damage fees after check-in (milestone 5, PRODUCT.md "Late fees" /
-- "Damage fees"): what the agency assessed and what happened to it.
-- { status: charged | link_sent | waived | failed, lateDays, lateAmount,
--   damagedSigns, damageAmount, total, paymentIntentId?, checkoutUrl?,
--   error?, at, by }
alter table orders add column if not exists fee_charge jsonb;
