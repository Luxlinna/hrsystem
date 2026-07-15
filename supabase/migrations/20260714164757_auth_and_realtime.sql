-- Allow pre-provisioning user_role_assignments by email before the person
-- has signed up (admin can invite by email; link fills in on first login).
alter table user_role_assignments alter column user_id drop not null;
alter table user_role_assignments drop constraint user_role_assignments_user_id_key;
alter table user_role_assignments drop constraint user_role_assignments_user_id_fkey;
alter table user_role_assignments add constraint user_role_assignments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
alter table user_role_assignments add constraint user_role_assignments_email_key unique (email);

-- Enable Realtime on tables the frontend subscribes to via postgres_changes.
alter publication supabase_realtime add table
  notifications, employees, candidates, job_postings, leave_requests,
  payroll_records, payroll_runs, payroll_approvals, onboarding_requests,
  onboarding_documents, onboarding_checklist_tasks, branches, announcements,
  attendance_records, training_enrollments, disciplinary_records, audit_logs;
