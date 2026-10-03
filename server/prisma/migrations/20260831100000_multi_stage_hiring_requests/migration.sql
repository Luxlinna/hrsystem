-- 4-Stage Hiring Requisition Pipeline & Permissions
-- 1. Add multi-stage columns to hiring_requests
alter table hiring_requests
  add column if not exists branch_approved_by text,
  add column if not exists branch_approved_at timestamptz,
  add column if not exists hr_reviewed_by text,
  add column if not exists hr_reviewed_at timestamptz,
  add column if not exists hr_admin_approved_by text,
  add column if not exists hr_admin_approved_at timestamptz,
  add column if not exists chairman_approved_by text,
  add column if not exists chairman_approved_at timestamptz,
  add column if not exists hr_assigned_to_id uuid references employees(id) on delete set null,
  add column if not exists hr_assigned_to_name text;

-- 2. Drop and update status check constraint for 4-stage workflow
alter table hiring_requests drop constraint if exists hiring_requests_status_check;
alter table hiring_requests add constraint hiring_requests_status_check 
  check (status in (
    'pending', 
    'pending_branch_review', 
    'pending_hr_review', 
    'pending_hr_admin_review', 
    'pending_chairman_review', 
    'approved', 
    'rejected', 
    'fulfilled'
  ));

-- 3. Add approval action permissions to app_roles
alter table app_roles
  add column if not exists hiring_requests_branch_approve boolean not null default false,
  add column if not exists hiring_requests_hr_review boolean not null default false,
  add column if not exists hiring_requests_hr_admin_approve boolean not null default false,
  add column if not exists hiring_requests_chairman_approve boolean not null default false;

-- 4. Enable permissions for standard roles
update app_roles set hiring_requests_branch_approve = true where name in ('Branch Admin', 'Branch Manager', 'CEO', 'Chairman', 'Super Admin');
update app_roles set hiring_requests_hr_review = true where name in ('HR Staff', 'HR Manager', 'Super Admin', 'Branch Admin');
update app_roles set hiring_requests_hr_admin_approve = true where name in ('HR Manager', 'Branch Admin', 'Super Admin', 'CEO', 'Chairman');
update app_roles set hiring_requests_chairman_approve = true where name in ('Chairman', 'Chairwoman', 'Super Admin', 'CEO');
