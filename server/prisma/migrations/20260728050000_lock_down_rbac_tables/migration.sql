-- Lock down role/permission management to Super Admins only.
--
-- Previously app_roles and user_role_assignments used the same blanket
-- "authenticated_full_access" policy as every other table (USING (true)
-- WITH CHECK (true)), meaning any signed-in user could grant themselves
-- Super Admin directly via the Supabase client, bypassing the Admin Portal
-- UI entirely. This replaces that with real enforcement:
--   - app_roles: readable by any authenticated user (needed for client-side
--     permission checks), writable only by Super Admins.
--   - user_role_assignments: a user can read only their own row (or all
--     rows if they're a Super Admin); writes are Super Admin only.
--   - first-login self-linking (matching a pre-provisioned row by email to
--     the new auth user id) goes through a SECURITY DEFINER RPC instead of
--     a client-side UPDATE, so it can't be abused to also change role_id.

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select ar.is_admin
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.link_my_role_assignment()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update user_role_assignments
  set user_id = auth.uid(), updated_at = now()
  where email = auth.jwt() ->> 'email'
    and user_id is null;
end;
$$;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.link_my_role_assignment() to authenticated;

drop policy if exists "authenticated_full_access" on app_roles;
create policy "app_roles_select" on app_roles for select to authenticated using (true);
create policy "app_roles_admin_insert" on app_roles for insert to authenticated with check (public.is_super_admin());
create policy "app_roles_admin_update" on app_roles for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "app_roles_admin_delete" on app_roles for delete to authenticated using (public.is_super_admin());

drop policy if exists "authenticated_full_access" on user_role_assignments;
create policy "ura_select_own_or_admin" on user_role_assignments for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
create policy "ura_admin_insert" on user_role_assignments for insert to authenticated with check (public.is_super_admin());
create policy "ura_admin_update" on user_role_assignments for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy "ura_admin_delete" on user_role_assignments for delete to authenticated using (public.is_super_admin());
