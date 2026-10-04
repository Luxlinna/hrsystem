-- Make Super Admin detection and first-login role linking tolerate assignment
-- rows that are matched by account email before user_id is populated.

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
        or lower(ura.email) = lower(auth.jwt() ->> 'email')
      order by (ura.user_id = auth.uid()) desc
      limit 1
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
  where lower(email) = lower(auth.jwt() ->> 'email')
    and user_id is null;
end;
$$;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.link_my_role_assignment() to authenticated;
