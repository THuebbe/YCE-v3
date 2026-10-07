-- Removes the pre-rate-limit 7-arg yce_create_booking_hold, superseded by
-- the 8-arg version in 20261008_booking_hold_rate_limit.sql. NOT
-- auto-applied; run by hand after it. Safe to re-run.
DROP FUNCTION IF EXISTS yce_create_booking_hold(text, text, date, date, jsonb, text, integer);
