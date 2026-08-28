-- Fix work_locations RLS policies

-- 1. Enable RLS
alter table work_locations enable row level security;

-- 2. Drop all previous work_locations policies
drop policy if exists "work_locations_select" on work_locations;
drop policy if exists "work_locations_insert" on work_locations;
drop policy if exists "work_locations_update" on work_locations;
drop policy if exists "work_locations_delete" on work_locations;
drop policy if exists "Allow read work_locations for authenticated" on work_locations;
drop policy if exists "Allow insert work_locations for authenticated" on work_locations;
drop policy if exists "Allow update work_locations for authenticated" on work_locations;
drop policy if exists "Allow delete work_locations for authenticated" on work_locations;

-- 3. SELECT: All authenticated users can read (frontend queries filter deleted_at is null)
-- NOTE: Must use (true) so that soft-delete UPDATE statements (which set deleted_at)
-- don't get rejected by PostgREST's RETURNING check.
create policy "work_locations_select" on work_locations
  for select to authenticated
  using (true);

-- 4. INSERT: Allow authenticated users to insert
create policy "work_locations_insert" on work_locations
  for insert to authenticated
  with check (true);

-- 5. UPDATE: Allow authenticated users to update/soft-delete
create policy "work_locations_update" on work_locations
  for update to authenticated
  using (true)
  with check (true);

-- 6. DELETE: Allow authenticated users if hard delete is ever used
create policy "work_locations_delete" on work_locations
  for delete to authenticated
  using (true);

-- 7. Verify the policies
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'work_locations'
order by policyname;
