-- Migration: Scope Role Permissions to BU and BU Sites
-- Allows each Business Unit (branch) and BU Site (work_location) to have its own unique roles and permissions.
-- Super Admin can manage all roles; BU Admin can adjust roles inside their own BU.

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
  where (
    (e.email is not null and lower(e.email) = lower(auth.jwt() ->> 'email'))
    or exists (
      select 1 from user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.deleted_at is null
        and (
          (e.email is not null and lower(e.email) = lower(ura.email))
          or (e.phone is not null and ura.email like concat('%', e.phone, '%'))
        )
    )
  )
  and e.deleted_at is null
  limit 1;
$$;

grant execute on function public.get_my_branch_id() to authenticated;

-- 2. Add branch_id and work_location_id to app_roles
alter table public.app_roles
  add column if not exists branch_id uuid references public.branches(id) on delete cascade,
  add column if not exists work_location_id uuid references public.work_locations(id) on delete cascade;

create index if not exists idx_app_roles_branch_id on public.app_roles (branch_id);
create index if not exists idx_app_roles_work_location_id on public.app_roles (work_location_id);

-- 3. Relax global unique constraint on role name so different BUs can have roles with the same name
alter table public.app_roles drop constraint if exists app_roles_name_key;

-- 4. Partial unique indexes:
-- Unique name for global roles (where both branch_id and work_location_id are null)
create unique index if not exists app_roles_global_name_unique
  on public.app_roles (lower(trim(name)))
  where branch_id is null and work_location_id is null;

-- Unique name per BU (when scoped to a BU across all its sites)
create unique index if not exists app_roles_branch_name_unique
  on public.app_roles (lower(trim(name)), branch_id)
  where work_location_id is null and branch_id is not null;

-- Unique name per BU site
create unique index if not exists app_roles_site_name_unique
  on public.app_roles (lower(trim(name)), work_location_id)
  where work_location_id is not null;

-- 5. Enable and update Row Level Security (RLS) on app_roles
alter table public.app_roles enable row level security;

drop policy if exists "app_roles_select" on public.app_roles;
drop policy if exists "app_roles_admin_insert" on public.app_roles;
drop policy if exists "app_roles_admin_update" on public.app_roles;
drop policy if exists "app_roles_admin_delete" on public.app_roles;
drop policy if exists "authenticated_full_access" on public.app_roles;

-- SELECT: Super Admin can read all roles; BU Admins & Employees can read Global roles or roles in their own branch
create policy "app_roles_select" on public.app_roles
  for select to authenticated
  using (
    public.is_super_admin()
    or branch_id is null
    or branch_id = public.get_my_branch_id()
  );

-- INSERT: Super Admin can insert for any BU or Global; BU Admin can insert ONLY for their own branch
create policy "app_roles_admin_insert" on public.app_roles
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and is_admin = false
      and name != 'Super Admin'
      and branch_id is not null
      and branch_id = public.get_my_branch_id()
    )
  );

-- UPDATE: Super Admin can update any role; BU Admin can update ONLY non-super roles in their own branch
create policy "app_roles_admin_update" on public.app_roles
  for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and is_admin = false
      and name != 'Super Admin'
      and branch_id is not null
      and branch_id = public.get_my_branch_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_branch_admin()
      and is_admin = false
      and name != 'Super Admin'
      and branch_id is not null
      and branch_id = public.get_my_branch_id()
    )
  );

-- DELETE: Super Admin can delete non-super roles; BU Admin can delete ONLY roles in their own branch
create policy "app_roles_admin_delete" on public.app_roles
  for delete to authenticated
  using (
    (public.is_super_admin() and is_admin = false and name != 'Super Admin')
    or (
      public.is_branch_admin()
      and is_admin = false
      and name != 'Super Admin'
      and branch_id is not null
      and branch_id = public.get_my_branch_id()
    )
  );
