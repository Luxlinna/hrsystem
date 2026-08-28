-- Seed work_locations for all active branches.
-- Run this in the Supabase Dashboard → SQL Editor.
-- Each branch gets a default "Head Office" location.
-- Add more rows per branch as needed (e.g. Factory, Warehouse).

insert into work_locations (branch_id, name, description, is_default)
select
  id as branch_id,
  'Head Office'    as name,
  'Main head office location' as description,
  true             as is_default
from branches
where deleted_at is null
  and status = 'active'
on conflict do nothing;

-- Example: add a second site for a specific branch by name:
-- insert into work_locations (branch_id, name, description, is_default)
-- select id, 'Kandal Factory', 'Manufacturing facility', false
-- from branches where name = 'Phnom Penh HQ' and deleted_at is null;

-- Verify what was inserted:
select wl.name, wl.is_default, b.name as branch_name
from work_locations wl
join branches b on b.id = wl.branch_id
where wl.deleted_at is null
order by b.name, wl.is_default desc;
