-- Milestone 3, chunk 4: Elite agencies set their own policies.
-- Shape (features/booking/policies.ts parsePolicies; gaps use defaults):
--   { noticeHours, feePercent, feeMinimum, damageFeePerSign }
-- The late fee stays in pricing_config.lateFee, where it always lived.
alter table agencies add column if not exists policy_config jsonb not null default '{}'::jsonb;
