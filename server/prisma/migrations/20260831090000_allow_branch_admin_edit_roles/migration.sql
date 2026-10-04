-- Allow Branch Admins to insert and update non-admin roles in app_roles

drop policy if exists "app_roles_admin_update" on app_roles;
create policy "app_roles_admin_update" on app_roles for update to authenticated
  using (
    public.is_super_admin()
    or (public.is_branch_admin() and is_admin = false and name != 'Super Admin')
  )
  with check (
    public.is_super_admin()
    or (public.is_branch_admin() and is_admin = false and name != 'Super Admin')
  );

drop policy if exists "app_roles_admin_insert" on app_roles;
create policy "app_roles_admin_insert" on app_roles for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.is_branch_admin() and is_admin = false and name != 'Super Admin')
  );
