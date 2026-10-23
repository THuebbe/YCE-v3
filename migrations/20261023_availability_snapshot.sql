-- Booking configurator: one snapshot of an agency's stock and the holds that
-- block it, for the wizard to work out availability in the browser
-- (src/features/booking/availability.ts, PRODUCT.md "Booking configurator").
-- APPLIED 2026-10-23 via the Supabase MCP. Additive only; safe to re-run.
--
-- Returns {signs: [...], holds: [...]}:
--   signs  every sign the agency has in stock (quantity > 0)
--   holds  holds that can block a day in [p_from, p_to], by the same rule as
--          yce_sign_availability: live temporary holds overlapping the range,
--          active order holds delivered on or before p_to. "mine" marks the
--          caller's own session (it doesn't block itself); no session ids or
--          customer details leave the database.

CREATE OR REPLACE FUNCTION yce_availability_snapshot(
  p_agency_id text,
  p_from date,
  p_to date,
  p_session_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'signs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'key', s.asset_key, 'type', s.sign_type,
        'character', s."character", 'style', s.style, 'colorway', s.colorway,
        'quantity', ai.quantity))
      FROM agency_inventory ai
      JOIN sign_library s ON s.id = ai.sign_id
      WHERE ai.agency_id = p_agency_id AND ai.quantity > 0 AND s.asset_key IS NOT NULL
    ), '[]'::jsonb),
    'holds', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'kind', h.hold_type,
        'start', h.rental_start, 'end', h.rental_end,
        'mine', p_session_id IS NOT NULL AND h.session_id = p_session_id,
        'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object('signId', hi.sign_id, 'quantity', hi.quantity)), '[]'::jsonb)
                  FROM inventory_hold_items hi WHERE hi.hold_id = h.id)))
      FROM inventory_holds h
      WHERE h.agency_id = p_agency_id
        AND h.is_active
        AND (
          (h.hold_type = 'temporary' AND h.expires_at > now()::timestamp
            AND h.rental_start <= p_to AND h.rental_end >= p_from)
          OR (h.hold_type = 'order' AND h.rental_start <= p_to)
        )
    ), '[]'::jsonb)
  );
$$;

-- RLS is off: keep it away from the public PostgREST roles (service role only)
REVOKE ALL ON FUNCTION yce_availability_snapshot(text, date, date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION yce_availability_snapshot(text, date, date, text) TO service_role;
