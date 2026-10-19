-- Milestone 3: each agency is on Essentials or Elite (PRODUCT.md "Plans").
-- Billing (chunk 2) keeps this in sync with the Stripe subscription; until
-- then it's set by hand. New agencies start on Essentials.
alter table agencies
  add column if not exists plan text not null default 'essentials'
  check (plan in ('essentials', 'elite'));

-- The existing agencies are all test agencies whose order flows were
-- verified with every document available: keep them on Elite.
update agencies set plan = 'elite' where created_at < '2026-10-19';
