-- Allow Branch Admins to read role assignments for employees in their branch
create or replace function public.is_branch_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from user_role_assignments ura
    join app_roles ar on ar.id = ura.role_id
    where (ura.user_id = auth.uid() or lower(ura.email) = lower(auth.jwt() ->> 'email'))
      and (ar.name = 'Branch Admin' or ar.name = 'Super Admin' or ar.is_admin = true)
      and ura.deleted_at is null
  );
$$;

grant execute on function public.is_branch_admin() to authenticated;

drop policy if exists "ura_select_own_or_admin" on user_role_assignments;

create policy "ura_select_own_or_admin" on user_role_assignments for select to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(auth.jwt() ->> 'email')
    or public.is_super_admin()
    or (
      public.is_branch_admin()
      and exists (
        select 1
        from employees branch_emp
        join employees my_emp on my_emp.branch_id = branch_emp.branch_id
        where lower(branch_emp.email) = lower(user_role_assignments.email)
          and lower(my_emp.email) = lower(auth.jwt() ->> 'email')
          and branch_emp.deleted_at is null
          and my_emp.deleted_at is null
      )
    )
  );
