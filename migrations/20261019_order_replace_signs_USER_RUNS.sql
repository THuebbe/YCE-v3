-- FOR THE USER TO RUN in the Supabase SQL editor (contains DELETE, so per
-- CLAUDE.md rule 5 Claude doesn't apply it). Safe to run more than once.
-- Needed by "Edit display" on the order page; until it runs, saving an edit
-- says the change couldn't be saved and nothing changes.
-- Swaps an order's reserved signs for a new layout, in one locked step:
-- stock is checked for the order's own rental window, not counting the
-- order's current reservation; nothing changes if anything is short.
-- (The DELETEs replace this order's own hold lines and sign list - the
-- same rows yce_convert_hold_to_order inserted - nothing else.)
create or replace function yce_replace_order_signs(
  p_order_id text, p_agency_id text, p_user_id text, p_items jsonb
) returns jsonb language plpgsql as $$
declare
  v_status text;
  v_hold inventory_holds%rowtype;
  v_shortages jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  select status into v_status from orders where id = p_order_id and agency_id = p_agency_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'order_not_found'); end if;
  if v_status not in ('pending', 'processing') then
    return jsonb_build_object('ok', false, 'reason', 'not_editable', 'status', v_status);
  end if;

  select * into v_hold from inventory_holds
  where order_id = p_order_id and agency_id = p_agency_id and hold_type = 'order' and is_active
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'hold_not_found'); end if;

  v_shortages := yce_hold_shortages(p_agency_id, v_hold.rental_start, v_hold.rental_end, p_items, v_hold.id);
  if jsonb_array_length(v_shortages) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
  end if;

  delete from inventory_hold_items where hold_id = v_hold.id;
  insert into inventory_hold_items (id, hold_id, sign_id, quantity, unit_price)
  select gen_random_uuid()::text, v_hold.id, r.sign_id, sum(r.quantity)::integer, 0
  from jsonb_to_recordset(p_items) as r(sign_id text, quantity integer)
  group by r.sign_id;

  delete from order_signs where order_id = p_order_id;
  insert into order_signs (id, order_id, sign_id, quantity)
  select gen_random_uuid()::text, p_order_id, sign_id, quantity
  from inventory_hold_items where hold_id = v_hold.id;

  insert into order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  values (gen_random_uuid()::text, p_order_id, 'editSigns', v_status, p_user_id, 'Display edited', '{}'::jsonb, now()::timestamp);

  return jsonb_build_object('ok', true);
end;
$$;
revoke execute on function yce_replace_order_signs(text, text, text, jsonb) from public, anon, authenticated;
