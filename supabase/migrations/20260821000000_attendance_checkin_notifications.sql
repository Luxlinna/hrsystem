-- Attendance check-in/check-out notifications. Both "who receives them" and
-- "how often they fire" are admin-configurable rather than hardcoded:
--
-- 1. attendance_notify (per-role, mirrors leave_approve / meeting_rooms_approve)
--    — off by default; an admin opts individual roles in from the Admin Portal.
-- 2. attendance_notify_scope (system_settings) — "exceptions" (only late
--    check-ins / early checkouts) or "all" (every check-in and check-out).
--    Defaults to "exceptions" so a full team clocking in twice a day doesn't
--    flood the people who opted in.

alter table app_roles add column if not exists attendance_notify boolean not null default false;

update app_roles
set attendance_notify = true
where is_admin = true
   or allowed_modules @> '{"*"}'
   or name in ('Super Admin', 'HR Manager', 'Branch Manager', 'Department Manager', 'HR Staff');

alter table notifications drop constraint if exists notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source in (
    'hire','leave','payroll','branches','system','employees','onboarding','offboard','finance',
    'it_management','benefits','training','tools','announcements','meeting_rooms','meeting-rooms',
    'password_reset','attendance'
  ));

insert into system_settings (key, value, type) values
  ('attendance_notify_scope', 'exceptions', 'text')
on conflict (key) do nothing;
