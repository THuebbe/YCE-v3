-- One-off data seed (owner, 2026-11-02): stock for the owner's own agency
-- "yardcard-elite" so its booking page can open for the first live test.
-- Gold and red letters, numbers and punctuation plus all decorations, 20
-- each (138 signs). Only what the owner chose; trim or extend on Signs.
-- Insert-only: never touches an existing stock row (on conflict do nothing).
-- APPLIED 2026-11-02 to production (YCEv3).

insert into public.agency_inventory
  (id, agency_id, sign_id, quantity, available_quantity, allocated_quantity, deployed_quantity, updated_at)
select 'inv_' || md5(a.id || ':' || s.id), a.id, s.id, 20, 20, 0, 0, now()::timestamp
from public.agencies a
join public.sign_library s on s.is_platform = true
  and (
    (s.category in ('Letters', 'Numbers', 'Punctuation') and s.colorway in ('gold', 'red'))
    or s.category = 'Decorations'
  )
where a.slug = 'yardcard-elite'
on conflict (agency_id, sign_id) do nothing;
