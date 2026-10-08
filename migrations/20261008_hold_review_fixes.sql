-- Code-review fixes for the booking holds (2026-10-07). NOT auto-applied;
-- run by hand after 20261008_booking_hold_rate_limit.sql. Safe to re-run.
-- Same signatures as before (CREATE OR REPLACE, no DROP).
--
-- 1. yce_create_booking_hold replaces EVERY live temporary hold of the same
--    wizard session at that agency, not just the id the browser remembered.
--    A reload or a failed regenerate used to lose that id and leave the old
--    hold blocking stock (and counting toward the per-IP limit) for an hour.
--    The session's own holds are released inside a subtransaction that is
--    rolled back when the new hold doesn't fit, so a refused regenerate
--    keeps the customer's existing reservation. p_replace_hold_id is kept
--    for call compatibility but no longer needed.
-- 2. yce_convert_hold_to_order also accepts a hold the expiry cron already
--    marked inactive (release_reason 'expired'); it re-checks stock, as it
--    already did for an expired-but-still-active hold.

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

  -- This session's own live holds are being replaced, so they don't count.
  IF p_client_key IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key
          AND created_at > (now() - interval '10 minutes')::timestamp) >= 30
    OR (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key AND agency_id = p_agency_id
          AND hold_type = 'temporary' AND is_active
          AND expires_at > now()::timestamp
          AND session_id IS DISTINCT FROM p_session_id) >= 3 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  BEGIN
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = 'replaced'
    WHERE agency_id = p_agency_id AND session_id = p_session_id
      AND hold_type = 'temporary' AND is_active;

    v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end, p_items);
    IF jsonb_array_length(v_shortages) > 0 THEN
      RAISE EXCEPTION 'yce_insufficient_stock' USING ERRCODE = 'P0001';
    END IF;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    -- Rolls back the release above; v_shortages keeps its value.
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
  END;

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

CREATE OR REPLACE FUNCTION yce_convert_hold_to_order(
  p_hold_id text,
  p_agency_id text,
  p_session_id text,
  p_order_id text,
  p_rental_start date,
  p_rental_end date
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_hold inventory_holds%ROWTYPE;
  v_items jsonb;
  v_shortages jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT * INTO v_hold FROM inventory_holds
  WHERE id = p_hold_id AND agency_id = p_agency_id AND session_id = p_session_id
    AND hold_type = 'temporary'
    AND (is_active OR release_reason = 'expired')
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'hold_not_found');
  END IF;

  IF v_hold.rental_start <> p_rental_start OR v_hold.rental_end <> p_rental_end THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dates_changed');
  END IF;

  IF NOT v_hold.is_active OR v_hold.expires_at <= now()::timestamp THEN
    SELECT jsonb_agg(jsonb_build_object('sign_id', sign_id, 'quantity', quantity))
    INTO v_items FROM inventory_hold_items WHERE hold_id = p_hold_id;
    v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end,
                                      COALESCE(v_items, '[]'::jsonb), p_hold_id);
    IF jsonb_array_length(v_shortages) > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
    END IF;
  END IF;

  UPDATE inventory_holds
  SET hold_type = 'order', order_id = p_order_id, expires_at = NULL,
      is_active = true, released_at = NULL, release_reason = NULL
  WHERE id = p_hold_id;

  INSERT INTO order_signs (id, order_id, sign_id, quantity)
  SELECT gen_random_uuid()::text, p_order_id, sign_id, quantity
  FROM inventory_hold_items WHERE hold_id = p_hold_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
