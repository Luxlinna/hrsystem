-- Fix RLS policies on room_bookings to allow authenticated employees,
-- phone-based accounts, and admins to submit, update, and manage bookings.

alter table room_bookings enable row level security;

-- 1. Select policy: all authenticated users can view active bookings
drop policy if exists "room_bookings_select" on room_bookings;
create policy "room_bookings_select" on room_bookings for select to authenticated using (true);

-- 2. Insert policy: all authenticated users can create / request reservations (status defaults to 'pending')
drop policy if exists "room_bookings_insert" on room_bookings;
create policy "room_bookings_insert" on room_bookings for insert to authenticated with check (true);

-- 3. Update policy: allow updating own bookings, or approving/rejecting if admin/approver
drop policy if exists "room_bookings_update" on room_bookings;
drop policy if exists "room_bookings_update_own_or_admin" on room_bookings;
create policy "room_bookings_update" on room_bookings for update to authenticated
  using (
    -- Any booking owner (via employee ID match or email/phone), or Super Admin / Role with approve capability
    booked_by in (
      select id from employees
      where lower(coalesce(email, '')) = lower(auth.jwt() ->> 'email')
         or regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(replace(replace(coalesce(auth.jwt() ->> 'email', ''), '@phone.hrmsystem.local', ''), 'phone_', ''), '\D', '', 'g')
    )
    or public.is_super_admin()
    or exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      and (ar.is_admin = true or ar.allowed_modules @> '{"*"}' or ar.meeting_rooms_approve = true or ar.name in ('HR Manager', 'Super Admin', 'Admin'))
    )
  )
  with check (true);

-- 4. Delete policy: allow soft-delete / delete by creator, admin, or approver
drop policy if exists "room_bookings_delete" on room_bookings;
drop policy if exists "room_bookings_delete_own_or_admin" on room_bookings;
create policy "room_bookings_delete" on room_bookings for delete to authenticated
  using (
    booked_by in (
      select id from employees
      where lower(coalesce(email, '')) = lower(auth.jwt() ->> 'email')
         or regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(replace(replace(coalesce(auth.jwt() ->> 'email', ''), '@phone.hrmsystem.local', ''), 'phone_', ''), '\D', '', 'g')
    )
    or public.is_super_admin()
    or exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      and (ar.is_admin = true or ar.allowed_modules @> '{"*"}' or ar.meeting_rooms_approve = true or ar.name in ('HR Manager', 'Super Admin', 'Admin'))
    )
  );
