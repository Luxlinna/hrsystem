-- Schema drift cleanup: these columns exist in production (added ad hoc, outside
-- of migrations, over time) but were never captured anywhere in migration
-- history. Captured here from the live schema (types, defaults and the
-- branch_id/shift_id foreign keys all confirmed against production) so a
-- from-scratch environment matches it.

alter table announcements
  add column if not exists branch_id uuid references branches(id) on delete set null;

alter table attendance_records
  add column if not exists clock_in_accuracy_m double precision,
  add column if not exists clock_in_branch_id uuid references branches(id) on delete set null,
  add column if not exists clock_in_latitude double precision,
  add column if not exists clock_in_longitude double precision,
  add column if not exists clock_out_accuracy_m double precision,
  add column if not exists clock_out_branch_id uuid references branches(id) on delete set null,
  add column if not exists clock_out_latitude double precision,
  add column if not exists clock_out_longitude double precision,
  add column if not exists current_status text,
  add column if not exists early_checkout_reason text,
  add column if not exists shift_id uuid references shifts(id) on delete set null;

alter table audit_logs
  add column if not exists branch_id uuid references branches(id) on delete set null;

alter table benefit_plans
  add column if not exists branch_id uuid references branches(id) on delete set null;

alter table branches
  add column if not exists updated_at timestamptz not null default now();

alter table candidates
  add column if not exists allowance text,
  add column if not exists bank_account_number text,
  add column if not exists bank_name text,
  add column if not exists bu_full_name text,
  add column if not exists code_bu text,
  add column if not exists contract_type text,
  add column if not exists current_address text,
  add column if not exists department text,
  add column if not exists division text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_phone_number text,
  add column if not exists employment_type text,
  add column if not exists fdc_end_date date,
  add column if not exists handle_bu text,
  add column if not exists hiring_info jsonb default '{}'::jsonb,
  add column if not exists hiring_status text,
  add column if not exists line_manager text,
  add column if not exists marital_status text,
  add column if not exists national_id_number text,
  add column if not exists position text,
  add column if not exists site text,
  add column if not exists start_date date,
  add column if not exists tax_method text,
  add column if not exists total_working_days text,
  add column if not exists working_hour text,
  add column if not exists working_location text;

alter table documents
  add column if not exists branch_id uuid references branches(id) on delete set null;

alter table employees
  add column if not exists hiring_info jsonb default '{}'::jsonb,
  add column if not exists shift_id uuid references shifts(id) on delete set null;

alter table notifications
  add column if not exists branch_id uuid references branches(id) on delete cascade;

alter table shifts
  add column if not exists break_end time,
  add column if not exists break_start time,
  add column if not exists early_leave_grace_minutes integer default 15,
  add column if not exists late_grace_minutes integer default 15,
  add column if not exists required_hours numeric(4,1) default 8,
  add column if not exists working_days integer[] default array[1,2,3,4,5,6];

alter table tools
  add column if not exists branch_id uuid references branches(id) on delete set null;

alter table unity_apps
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;
