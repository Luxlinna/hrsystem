-- Multi-stage hiring requests workflow & permissions
-- 1. Add multi-stage columns to hiring_requests
alter table hiring_requests
  add column if not exists branch_approved_by text,
  add column if not exists branch_approved_at timestamptz,
  add column if not exists hr_assigned_to_id uuid references employees(id) on delete set null,
  add column if not exists hr_assigned_to_name text,
  add column if not exists hr_reviewed_by text,
  add column if not exists hr_reviewed_at timestamptz;

-- 2. Drop and update status check constraint to support multi-stage statuses if applicable
alter table hiring_requests drop constraint if exists hiring_requests_status_check;
alter table hiring_requests add constraint hiring_requests_status_check 
  check (status in ('pending', 'pending_branch_review', 'pending_hr_review', 'approved', 'rejected', 'fulfilled'));

-- 3. Add approval action permissions to app_roles
alter table app_roles
  add column if not exists hiring_requests_branch_approve boolean not null default false,
  add column if not exists hiring_requests_hr_review boolean not null default false;

-- 4. Enable permissions for standard roles
update app_roles set hiring_requests_branch_approve = true where name in ('Branch Admin', 'Branch Manager', 'CEO', 'Chairman', 'Super Admin');
update app_roles set hiring_requests_hr_review = true where name in ('HR Manager', 'HR Staff', 'Super Admin', 'Branch Admin');
