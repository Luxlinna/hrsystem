-- Soft delete support (Recycle Bin) for password_reset_requests.
-- Admins can clear old/processed reset requests from the Admin Portal list;
-- they are hidden there but remain recoverable from the Recycle Bin page.

alter table password_reset_requests add column if not exists deleted_at timestamptz;
alter table password_reset_requests add column if not exists deleted_by text;

-- The client soft-deletes (UPDATE) and permanently deletes (DELETE) rows
-- directly, so mirror the existing admin SELECT policy for those actions.
drop policy if exists "admins can update password reset requests" on password_reset_requests;
create policy "admins can update password reset requests"
  on public.password_reset_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and ura.deleted_at is null
        and (ar.is_admin = true or ar.allowed_modules @> array['*']::text[] or ar.allowed_modules @> array['settings']::text[])
    )
  )
  with check (
    exists (
      select 1
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and ura.deleted_at is null
        and (ar.is_admin = true or ar.allowed_modules @> array['*']::text[] or ar.allowed_modules @> array['settings']::text[])
    )
  );

drop policy if exists "admins can delete password reset requests" on password_reset_requests;
create policy "admins can delete password reset requests"
  on public.password_reset_requests
  for delete
  to authenticated
  using (
    exists (
      select 1
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and ura.deleted_at is null
        and (ar.is_admin = true or ar.allowed_modules @> array['*']::text[] or ar.allowed_modules @> array['settings']::text[])
    )
  );
