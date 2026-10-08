-- Rate-limit configurator holds per client (hashed IP), decided 2026-10-07.
-- NOT auto-applied. Run by hand after 20261007_booking_inventory_holds.sql.
-- Safe to re-run.
--
-- Limits, checked under the same per-agency advisory lock as the stock check:
--   - at most 3 live temporary holds per client per agency (a household
--     sharing an IP has room; one script can't hold the whole library)
--   - at most 30 holds created per client per 10 minutes, all agencies
--     (refused checks aren't counted: they hold no stock)
-- A NULL key (no IP, e.g. local dev) skips both.

ALTER TABLE inventory_holds ADD COLUMN IF NOT EXISTS client_key text;

CREATE INDEX IF NOT EXISTS inventory_holds_client_key_idx
  ON inventory_holds (client_key, created_at)
  WHERE client_key IS NOT NULL;

-- Adds an overload (8 args). The old 7-arg version is dropped separately in
-- 20261008_drop_old_create_booking_hold.sql (a DROP needs the user's
-- approval in the Supabase MCP); app code always passes p_client_key, so it
-- only ever matches this one.
CREATE OR REPLACE FUNCTION yce_create_booking_hold(
  p_agency_id text,
  p_session_id text,
  p_rental_start date,
  p_rental_end date,
  p_items jsonb,
  p_replace_hold_id text DEFAULT NULL,
  p_client_key text DEFAULT NULL,
  p_ttl_minutes integer DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_replace text;
  v_shortages jsonb;
  v_hold_id text := gen_random_uuid()::text;
  v_expires timestamp := (now() + make_interval(mins => p_ttl_minutes))::timestamp;
BEGIN
  IF p_session_id IS NULL OR p_rental_start IS NULL OR p_rental_end IS NULL
     OR p_rental_end < p_rental_start
     OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_request');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  -- Only a live temporary hold from this same session may be replaced.
  SELECT id INTO v_replace FROM inventory_holds
  WHERE id = p_replace_hold_id AND agency_id = p_agency_id
    AND session_id = p_session_id AND hold_type = 'temporary' AND is_active;

  IF p_client_key IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key
          AND created_at > (now() - interval '10 minutes')::timestamp) >= 30
    OR (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key AND agency_id = p_agency_id
          AND hold_type = 'temporary' AND is_active
          AND expires_at > now()::timestamp
          AND id IS DISTINCT FROM v_replace) >= 3 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end, p_items, v_replace);
  IF jsonb_array_length(v_shortages) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
  END IF;

  IF v_replace IS NOT NULL THEN
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = 'replaced'
    WHERE id = v_replace;
  END IF;

  INSERT INTO inventory_holds (id, agency_id, session_id, hold_type, rental_start,
                               rental_end, expires_at, is_active, client_key)
  VALUES (v_hold_id, p_agency_id, p_session_id, 'temporary', p_rental_start,
          p_rental_end, v_expires, true, p_client_key);

  INSERT INTO inventory_hold_items (id, hold_id, sign_id, quantity, unit_price)
  SELECT gen_random_uuid()::text, v_hold_id, r.sign_id, SUM(r.quantity)::integer, 0
  FROM jsonb_to_recordset(p_items) AS r(sign_id text, quantity integer)
  GROUP BY r.sign_id;

  RETURN jsonb_build_object('ok', true, 'hold_id', v_hold_id, 'expires_at', v_expires);
END;
$$;

REVOKE ALL ON FUNCTION yce_create_booking_hold(text,text,date,date,jsonb,text,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION yce_create_booking_hold(text,text,date,date,jsonb,text,text,integer)
  TO service_role;
