-- Soft delete support (Recycle Bin).
-- Instead of permanently erasing rows, module pages now mark records as
-- deleted by setting deleted_at (+ who did it). The normal UI hides those
-- rows, and an admin-only Recycle Bin page can restore them or permanently
-- delete them.
--
-- Kept as hard delete on purpose (ephemeral / config / infra data):
--   notifications, app_roles, user_role_assignments,
--   webauthn_challenges, fcm_tokens, task_activities

alter table disciplinary_records       add column if not exists deleted_at timestamptz;
alter table disciplinary_records       add column if not exists deleted_by text;
alter table documents                  add column if not exists deleted_at timestamptz;
alter table documents                  add column if not exists deleted_by text;
alter table announcements              add column if not exists deleted_at timestamptz;
alter table announcements              add column if not exists deleted_by text;
alter table tasks                      add column if not exists deleted_at timestamptz;
alter table tasks                      add column if not exists deleted_by text;
alter table it_assets                  add column if not exists deleted_at timestamptz;
alter table it_assets                  add column if not exists deleted_by text;
alter table it_tickets                 add column if not exists deleted_at timestamptz;
alter table it_tickets                 add column if not exists deleted_by text;
alter table expense_records            add column if not exists deleted_at timestamptz;
alter table expense_records            add column if not exists deleted_by text;
alter table job_postings               add column if not exists deleted_at timestamptz;
alter table job_postings               add column if not exists deleted_by text;
alter table candidates                 add column if not exists deleted_at timestamptz;
alter table candidates                 add column if not exists deleted_by text;
alter table interviews                 add column if not exists deleted_at timestamptz;
alter table interviews                 add column if not exists deleted_by text;
alter table training_courses           add column if not exists deleted_at timestamptz;
alter table training_courses           add column if not exists deleted_by text;
alter table training_enrollments       add column if not exists deleted_at timestamptz;
alter table training_enrollments       add column if not exists deleted_by text;
alter table room_bookings              add column if not exists deleted_at timestamptz;
alter table room_bookings              add column if not exists deleted_by text;
alter table onboarding_checklist_tasks add column if not exists deleted_at timestamptz;
alter table onboarding_checklist_tasks add column if not exists deleted_by text;
alter table shift_assignments          add column if not exists deleted_at timestamptz;
alter table shift_assignments          add column if not exists deleted_by text;
alter table work_logs                  add column if not exists deleted_at timestamptz;
alter table work_logs                  add column if not exists deleted_by text;

-- room_bookings RLS only had select/insert/delete policies. Soft delete
-- issues an UPDATE, which would otherwise be blocked, so allow the same
-- people who may delete a booking to "delete" (soft) it.
drop policy if exists "room_bookings_update_own_or_admin" on room_bookings;
create policy "room_bookings_update_own_or_admin" on room_bookings for update to authenticated using (
  booked_by in (select id from employees where email = auth.jwt() ->> 'email')
  or public.is_super_admin()
) with check (true);
