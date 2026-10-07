-- Milestone 1: real inventory + server-side holds for the booking wizard.
-- NOT auto-applied. Run by hand (Supabase SQL editor or MCP), then run
-- 20261007_seed_placeholder_sign_library.sql. Safe to re-run.
--
-- Hold model (decided 2026-10-07):
--   temporary  configurator hold; expires after 1h of inactivity
--              (expires_at slides forward on activity). Blocks its own
--              rental dates only.
--   order      created when an order is placed (the temporary hold is
--              converted). Has no expiry: it blocks the signs from
--              rental_start until released at check-in (returned / damaged
--              out), cancellation, or by hand via yce_release_order_hold().
--
-- Availability of a sign for [start, end] =
--   agency_inventory.quantity
--   - live temporary holds overlapping [start, end]
--   - active order holds with rental_start <= end
-- All writes take a per-agency advisory lock, so two customers can't both
-- get the last unit.

-- ---------------------------------------------------------------- schema
ALTER TABLE sign_library
  ADD COLUMN IF NOT EXISTS asset_key text,
  ADD COLUMN IF NOT EXISTS sign_type text,
  ADD COLUMN IF NOT EXISTS "character" text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS colorway text;

CREATE UNIQUE INDEX IF NOT EXISTS sign_library_asset_key_key
  ON sign_library (asset_key);

ALTER TABLE inventory_holds
  ADD COLUMN IF NOT EXISTS hold_type text NOT NULL DEFAULT 'temporary',
  ADD COLUMN IF NOT EXISTS rental_start date,
  ADD COLUMN IF NOT EXISTS rental_end date,
  ADD COLUMN IF NOT EXISTS released_at timestamp,
  ADD COLUMN IF NOT EXISTS release_reason text;

ALTER TABLE inventory_holds ALTER COLUMN expires_at DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE inventory_holds ADD CONSTRAINT inventory_holds_hold_type_check
    CHECK (hold_type IN ('temporary', 'order'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS inventory_holds_agency_active_idx
  ON inventory_holds (agency_id, is_active, hold_type);

-- ------------------------------------------------------------ availability
CREATE OR REPLACE FUNCTION yce_sign_availability(
  p_agency_id text,
  p_start date,
  p_end date,
  p_exclude_hold_id text DEFAULT NULL
) RETURNS TABLE (sign_id text, owned integer, blocked integer, available integer)
LANGUAGE sql STABLE AS $$
  WITH blocking AS (
    SELECT hi.sign_id, SUM(hi.quantity)::integer AS qty
    FROM inventory_holds h
    JOIN inventory_hold_items hi ON hi.hold_id = h.id
    WHERE h.agency_id = p_agency_id
      AND h.is_active
      AND (p_exclude_hold_id IS NULL OR h.id <> p_exclude_hold_id)
      AND (
        (h.hold_type = 'temporary'
          AND h.expires_at > now()::timestamp
          AND h.rental_start <= p_end
          AND h.rental_end >= p_start)
        OR
        (h.hold_type = 'order' AND h.rental_start <= p_end)
      )
    GROUP BY hi.sign_id
  )
  SELECT ai.sign_id,
         ai.quantity,
         COALESCE(b.qty, 0),
         GREATEST(ai.quantity - COALESCE(b.qty, 0), 0)
  FROM agency_inventory ai
  LEFT JOIN blocking b ON b.sign_id = ai.sign_id
  WHERE ai.agency_id = p_agency_id;
$$;

-- Requested items that don't fit, as [{sign_id, requested, available}].
CREATE OR REPLACE FUNCTION yce_hold_shortages(
  p_agency_id text,
  p_start date,
  p_end date,
  p_items jsonb,
  p_exclude_hold_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  WITH req AS (
    SELECT r.sign_id, SUM(r.quantity)::integer AS requested
    FROM jsonb_to_recordset(p_items) AS r(sign_id text, quantity integer)
    GROUP BY r.sign_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'sign_id', req.sign_id,
           'requested', req.requested,
           'available', COALESCE(av.available, 0))), '[]'::jsonb)
  FROM req
  LEFT JOIN yce_sign_availability(p_agency_id, p_start, p_end, p_exclude_hold_id) av
    ON av.sign_id = req.sign_id
  WHERE req.requested > COALESCE(av.available, 0);
$$;

-- ------------------------------------------------------- temporary holds
-- Creates a temporary hold, or reports shortages. With p_replace_hold_id
-- (the session's previous preview hold), the old hold's units count as free
-- for the check and it is released only if the new hold succeeds.
CREATE OR REPLACE FUNCTION yce_create_booking_hold(
  p_agency_id text,
  p_session_id text,
  p_rental_start date,
  p_rental_end date,
  p_items jsonb,
  p_replace_hold_id text DEFAULT NULL,
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
                               rental_end, expires_at, is_active)
  VALUES (v_hold_id, p_agency_id, p_session_id, 'temporary', p_rental_start,
          p_rental_end, v_expires, true);

  INSERT INTO inventory_hold_items (id, hold_id, sign_id, quantity, unit_price)
  SELECT gen_random_uuid()::text, v_hold_id, r.sign_id, SUM(r.quantity)::integer, 0
  FROM jsonb_to_recordset(p_items) AS r(sign_id text, quantity integer)
  GROUP BY r.sign_id;

  RETURN jsonb_build_object('ok', true, 'hold_id', v_hold_id, 'expires_at', v_expires);
END;
$$;

-- Slides a live temporary hold's expiry forward (customer activity).
CREATE OR REPLACE FUNCTION yce_touch_booking_hold(
  p_hold_id text,
  p_agency_id text,
  p_session_id text,
  p_ttl_minutes integer DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_expires timestamp := (now() + make_interval(mins => p_ttl_minutes))::timestamp;
BEGIN
  UPDATE inventory_holds SET expires_at = v_expires
  WHERE id = p_hold_id AND agency_id = p_agency_id AND session_id = p_session_id
    AND hold_type = 'temporary' AND is_active AND expires_at > now()::timestamp;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'hold_expired_or_missing');
  END IF;
  RETURN jsonb_build_object('ok', true, 'expires_at', v_expires);
END;
$$;

-- ------------------------------------------------------------ order holds
-- Turns the session's temporary hold into the order's hold and writes the
-- order's signs. An expired hold is re-checked and converted if the stock
-- is still free.
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
    AND hold_type = 'temporary' AND is_active
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'hold_not_found');
  END IF;

  IF v_hold.rental_start <> p_rental_start OR v_hold.rental_end <> p_rental_end THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dates_changed');
  END IF;

  IF v_hold.expires_at <= now()::timestamp THEN
    SELECT jsonb_agg(jsonb_build_object('sign_id', sign_id, 'quantity', quantity))
    INTO v_items FROM inventory_hold_items WHERE hold_id = p_hold_id;
    v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end,
                                      COALESCE(v_items, '[]'::jsonb), p_hold_id);
    IF jsonb_array_length(v_shortages) > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
    END IF;
  END IF;

  UPDATE inventory_holds
  SET hold_type = 'order', order_id = p_order_id, expires_at = NULL
  WHERE id = p_hold_id;

  INSERT INTO order_signs (id, order_id, sign_id, quantity)
  SELECT gen_random_uuid()::text, p_order_id, sign_id, quantity
  FROM inventory_hold_items WHERE hold_id = p_hold_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Returns an order's signs to stock. Stand-in for check-in (milestone 5);
-- run by hand to free test orders: SELECT yce_release_order_hold('<order id>');
CREATE OR REPLACE FUNCTION yce_release_order_hold(
  p_order_id text,
  p_reason text DEFAULT 'released_manually'
) RETURNS integer
LANGUAGE sql AS $$
  WITH released AS (
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = p_reason
    WHERE order_id = p_order_id AND hold_type = 'order' AND is_active
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM released;
$$;

-- Deactivates expired temporary holds (cron). Availability already ignores
-- them, so this is housekeeping, not correctness.
CREATE OR REPLACE FUNCTION yce_expire_temporary_holds() RETURNS integer
LANGUAGE sql AS $$
  WITH expired AS (
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = 'expired'
    WHERE hold_type = 'temporary' AND is_active AND expires_at <= now()::timestamp
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM expired;
$$;

-- Styles/colorways an agency stocks, for the wizard's pickers. A function
-- rather than a PostgREST select so a large library isn't cut at max-rows.
CREATE OR REPLACE FUNCTION yce_owned_styles(p_agency_id text)
RETURNS TABLE (style text, colorway text)
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT s.style, s.colorway
  FROM agency_inventory ai
  JOIN sign_library s ON s.id = ai.sign_id
  WHERE ai.agency_id = p_agency_id AND ai.quantity > 0
    AND s.style IS NOT NULL AND s.colorway IS NOT NULL
  ORDER BY 1, 2;
$$;

-- RLS is off, so keep these out of reach of the public anon/authenticated
-- PostgREST roles; only the server's service-role client may call them.
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'yce_sign_availability(text,date,date,text)',
    'yce_hold_shortages(text,date,date,jsonb,text)',
    'yce_create_booking_hold(text,text,date,date,jsonb,text,integer)',
    'yce_touch_booking_hold(text,text,text,integer)',
    'yce_convert_hold_to_order(text,text,text,text,date,date)',
    'yce_release_order_hold(text,text)',
    'yce_expire_temporary_holds()',
    'yce_owned_styles(text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;
