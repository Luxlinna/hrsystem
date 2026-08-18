-- Add soft delete columns (deleted_at, deleted_by) to remaining report tables
-- so all modules report deletion date/time and actor.

alter table leave_requests      add column if not exists deleted_at timestamptz;
alter table leave_requests      add column if not exists deleted_by text;

alter table payroll_records     add column if not exists deleted_at timestamptz;
alter table payroll_records     add column if not exists deleted_by text;

alter table onboarding_requests add column if not exists deleted_at timestamptz;
alter table onboarding_requests add column if not exists deleted_by text;

alter table shifts              add column if not exists deleted_at timestamptz;
alter table shifts              add column if not exists deleted_by text;

alter table employees           add column if not exists deleted_at timestamptz;
alter table employees           add column if not exists deleted_by text;
