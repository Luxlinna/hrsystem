-- Strict Branch Scoping & RLS for work_locations
-- 1. Helper function to get current user's branch_id
create or replace function public.get_my_branch_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select e.branch_id
  from employees e
  where (e.user_id = auth.uid() or lower(e.email) = lower(auth.jwt() ->> 'email'))
    and e.deleted_at is null
  limit 1;
$$;

grant execute on function public.get_my_branch_id() to authenticated;

-- 2. Enable RLS
alter table work_locations enable row level security;

-- 3. Drop previous policies
drop policy if exists "work_locations_select" on work_locations;
drop policy if exists "work_locations_insert" on work_locations;
drop policy if exists "work_locations_update" on work_locations;
drop policy if exists "work_locations_delete" on work_locations;
drop policy if exists "Allow read work_locations for authenticated" on work_locations;
drop policy if exists "Allow insert work_locations for authenticated" on work_locations;
drop policy if exists "Allow update work_locations for authenticated" on work_locations;
drop policy if exists "Allow delete work_locations for authenticated" on work_locations;

-- 4. SELECT: All authenticated users can read (app queries filter deleted_at is null)
-- (true) is required so PostgREST's UPDATE ... RETURNING can return soft-deleted rows without 42501
create policy "work_locations_select" on work_locations
  for select to authenticated
  using (true);

-- 5. INSERT: Super Admin can create for any branch; Branch Admin ONLY for their own branch
create policy "work_locations_insert" on work_locations
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and branch_id = public.get_my_branch_id()
    )
  );

-- 6. UPDATE: Super Admin can update/delete any; Branch Admin ONLY for their own branch
create policy "work_locations_update" on work_locations
  for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and branch_id = public.get_my_branch_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and branch_id = public.get_my_branch_id()
    )
  );

-- 7. DELETE: Super Admin can delete any; Branch Admin ONLY for their own branch
create policy "work_locations_delete" on work_locations
  for delete to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and branch_id = public.get_my_branch_id()
    )
  );

-- 8. Verify the policies
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'work_locations'
order by policyname;
