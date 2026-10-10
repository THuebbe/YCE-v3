-- Dashboard order actions that close the hold loop (2026-10-10). NOT
-- auto-applied; run by hand after 20261008_hold_review_fixes.sql. Safe to
-- re-run.
--
-- Decided 2026-10-10: at check-in, DAMAGED and MISSING signs leave stock for
-- good (agency_inventory.quantity drops); GOOD signs simply come back. Either
-- way the order hold is released, so the signs stop blocking later dates.
-- Cancelling releases the hold too; refunds arrive with Stripe (milestone 2).
-- A DEPLOYED order can't be cancelled - its signs are in a yard; it ends with
-- check-in.

ALTER TABLE sign_check_ins ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

-- The signs an order holds: order_signs for wizard bookings, order_items for
-- older/seeded orders that predate order_signs.
CREATE OR REPLACE FUNCTION yce_order_sign_lines(p_order_id text)
RETURNS TABLE (sign_id text, quantity integer)
LANGUAGE sql STABLE AS $$
  SELECT os.sign_id, SUM(os.quantity)::integer FROM order_signs os
  WHERE os.order_id = p_order_id GROUP BY os.sign_id
  UNION ALL
  SELECT oi.sign_id, SUM(oi.quantity)::integer FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND NOT EXISTS (SELECT 1 FROM order_signs x WHERE x.order_id = p_order_id)
  GROUP BY oi.sign_id;
$$;

-- p_lines: [{sign_id, good, damaged, missing, notes}] - one per sign line,
-- good + damaged + missing must equal what the order holds of that sign.
CREATE OR REPLACE FUNCTION yce_check_in_order(
  p_order_id text,
  p_agency_id text,
  p_user_id text,
  p_lines jsonb,
  p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_status text;
  v_mismatch jsonb;
  v_lost integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT status INTO v_status FROM orders
  WHERE id = p_order_id AND agency_id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;
  IF v_status <> 'deployed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_deployed', 'status', v_status);
  END IF;

  -- Every held sign accounted for, nothing extra
  WITH want AS (SELECT * FROM yce_order_sign_lines(p_order_id)),
  got AS (
    SELECT l.sign_id, SUM(COALESCE(l.good,0) + COALESCE(l.damaged,0) + COALESCE(l.missing,0))::integer AS n
    FROM jsonb_to_recordset(p_lines) AS l(sign_id text, good integer, damaged integer, missing integer)
    GROUP BY l.sign_id
  )
  SELECT jsonb_agg(jsonb_build_object('sign_id', COALESCE(w.sign_id, g.sign_id),
                                      'expected', COALESCE(w.quantity, 0), 'counted', COALESCE(g.n, 0)))
  INTO v_mismatch
  FROM want w FULL JOIN got g ON g.sign_id = w.sign_id
  WHERE COALESCE(w.quantity, 0) <> COALESCE(g.n, 0);
  IF v_mismatch IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'count_mismatch', 'lines', v_mismatch);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_lines) AS l(good integer, damaged integer, missing integer)
             WHERE LEAST(COALESCE(l.good,0), COALESCE(l.damaged,0), COALESCE(l.missing,0)) < 0) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_request');
  END IF;

  INSERT INTO sign_check_ins (id, order_id, sign_id, condition, quantity, notes, checked_in_by_id, created_at)
  SELECT gen_random_uuid()::text, p_order_id, l.sign_id, c.condition, c.n, NULLIF(l.notes, ''), p_user_id, now()::timestamp
  FROM jsonb_to_recordset(p_lines) AS l(sign_id text, good integer, damaged integer, missing integer, notes text)
  CROSS JOIN LATERAL (VALUES ('good', COALESCE(l.good,0)), ('damaged', COALESCE(l.damaged,0)),
                             ('missing', COALESCE(l.missing,0))) AS c(condition, n)
  WHERE c.n > 0;

  -- Damaged and missing signs leave the agency's stock for good
  UPDATE agency_inventory ai
  SET quantity = GREATEST(ai.quantity - x.lost, 0),
      available_quantity = GREATEST(ai.available_quantity - x.lost, 0),
      updated_at = now()::timestamp
  FROM (SELECT l.sign_id, SUM(COALESCE(l.damaged,0) + COALESCE(l.missing,0))::integer AS lost
        FROM jsonb_to_recordset(p_lines) AS l(sign_id text, damaged integer, missing integer)
        GROUP BY l.sign_id) x
  WHERE ai.agency_id = p_agency_id AND ai.sign_id = x.sign_id AND x.lost > 0;

  SELECT COALESCE(SUM(COALESCE(l.damaged,0) + COALESCE(l.missing,0)), 0) INTO v_lost
  FROM jsonb_to_recordset(p_lines) AS l(damaged integer, missing integer);

  UPDATE inventory_holds
  SET is_active = false, released_at = now()::timestamp, release_reason = 'checked_in'
  WHERE order_id = p_order_id AND hold_type = 'order' AND is_active;

  UPDATE orders SET status = 'completed', completed_at = now()::timestamp, updated_at = now()::timestamp
  WHERE id = p_order_id;

  INSERT INTO order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  VALUES (gen_random_uuid()::text, p_order_id, 'checkInSigns', 'completed', p_user_id,
          NULLIF(p_notes, ''), jsonb_build_object('lines', p_lines, 'removed_from_stock', v_lost),
          now()::timestamp);

  RETURN jsonb_build_object('ok', true, 'removed_from_stock', v_lost);
END;
$$;

CREATE OR REPLACE FUNCTION yce_cancel_order(
  p_order_id text,
  p_agency_id text,
  p_user_id text,
  p_reason text DEFAULT NULL,
  p_refund_type text DEFAULT 'none'
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT status INTO v_status FROM orders
  WHERE id = p_order_id AND agency_id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;
  IF v_status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_cancellable', 'status', v_status);
  END IF;

  UPDATE inventory_holds
  SET is_active = false, released_at = now()::timestamp, release_reason = 'cancelled'
  WHERE order_id = p_order_id AND hold_type = 'order' AND is_active;

  UPDATE orders
  SET status = 'cancelled', cancelled_at = now()::timestamp,
      cancellation_reason = NULLIF(p_reason, ''), updated_at = now()::timestamp
  WHERE id = p_order_id;

  INSERT INTO order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  VALUES (gen_random_uuid()::text, p_order_id, 'cancel', 'cancelled', p_user_id,
          NULLIF(p_reason, ''), jsonb_build_object('refund_requested', p_refund_type,
            'refund_processed', false), now()::timestamp);

  RETURN jsonb_build_object('ok', true);
END;
$$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'yce_order_sign_lines(text)',
    'yce_check_in_order(text,text,text,jsonb,text)',
    'yce_cancel_order(text,text,text,text,text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;
