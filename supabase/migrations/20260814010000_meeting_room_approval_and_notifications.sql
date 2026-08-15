-- Meeting room booking approval workflow & notifications:
-- - All employees can submit room booking requests (status: 'pending')
-- - Includes attendees count, special requirements, and refreshments/water requests
-- - ONLY Admin and HR Managers can approve (status: 'approved') or reject (with reason)
-- - Regular employees ONLY have permission to cancel their own bookings (status: 'cancelled')
-- - Admin and HR Managers can also cancel previously approved bookings with a reason
-- - Rejection/cancellation clears the time slot so anyone can book again
-- - Notifications sent upon booking request, approval, rejection, and cancellation

alter table room_bookings
  add column if not exists status text not null default 'approved' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  add column if not exists attendees_count integer default 1,
  add column if not exists special_requirements text,
  add column if not exists refreshments text,
  add column if not exists approved_requirements text,
  add column if not exists declined_requirements text,
  add column if not exists approved_refreshments text,
  add column if not exists declined_refreshments text,
  add column if not exists approval_notes text,
  add column if not exists approved_by uuid references employees(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists cancelled_by uuid references employees(id) on delete set null,
  add column if not exists cancelled_at timestamptz;

-- Set default for any new bookings created going forward to 'pending'
alter table room_bookings alter column status set default 'pending';

-- Drop previous exclusion constraint and recreate it so it blocks both pending and approved bookings.
-- No two active reservations (pending or approved) can double-book the same slot!
-- Only cancelled or rejected bookings release the slot.
alter table room_bookings drop constraint if exists room_bookings_no_overlap;
alter table room_bookings add constraint room_bookings_no_overlap
  exclude using gist (
    room_id with =,
    tsrange((date + start_time)::timestamp, (date + end_time)::timestamp) with &&
  ) where (status in ('pending', 'approved'));

-- Add meeting_rooms_approve permission flag to app_roles
alter table app_roles add column if not exists meeting_rooms_approve boolean not null default false;

-- Super Admin & HR Manager have it true by default
update app_roles set meeting_rooms_approve = true where is_admin = true or name in ('Super Admin', 'HR Manager');

-- Strict RLS update policy:
-- 1. Regular employees can edit their own pending bookings or cancel their own bookings
-- 2. Super Admin, Admin, HR Manager, or ANY role with meeting_rooms_approve = true can approve/reject
drop policy if exists "room_bookings_update" on room_bookings;
create policy "room_bookings_update" on room_bookings for update to authenticated
  using (
    booked_by in (select id from employees where email = auth.jwt() ->> 'email')
    or public.is_super_admin()
    or exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      and (ar.is_admin = true or ar.allowed_modules @> '{"*"}' or ar.meeting_rooms_approve = true or ar.name in ('HR Manager', 'Super Admin'))
    )
  )
  with check (
    -- Regular employee: can edit their own booking while pending, or cancel it
    (
      booked_by in (select id from employees where email = auth.jwt() ->> 'email')
      and status in ('pending', 'cancelled')
    )
    -- Admin, HR Manager, or any role with meeting_rooms_approve: full approval, rejection, and cancellation authority
    or public.is_super_admin()
    or exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      and (ar.is_admin = true or ar.allowed_modules @> '{"*"}' or ar.meeting_rooms_approve = true or ar.name in ('HR Manager', 'Super Admin'))
    )
  );

-- Update notifications.source check constraint to allow meeting room notifications
alter table notifications drop constraint if exists notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source is null or source in (
    'hire',
    'leave',
    'payroll',
    'branches',
    'system',
    'employees',
    'onboarding',
    'offboard',
    'finance',
    'it_management',
    'benefits',
    'tools',
    'announcements',
    'meeting_rooms',
    'meeting-rooms'
  )) not valid;

-- Insert Training Room
insert into meeting_rooms (name, capacity, color)
select 'Training Room', 30, '#059669'
where not exists (select 1 from meeting_rooms where name = 'Training Room');

-- Rename Big Meeting Room to VIP Room
update meeting_rooms set name = 'VIP Room' where name = 'Big Meeting Room';
