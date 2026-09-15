-- =========================================================================
-- 33 Standard Fields Hiring & Employment Information for Employees
-- =========================================================================

-- 1. Ensure all 33 hiring and employment columns exist on the employees table
alter table employees
  add column if not exists employee_code text,
  add column if not exists full_name text,
  add column if not exists kh_name text,
  add column if not exists gender text,
  add column if not exists date_of_birth date,
  add column if not exists marital_status text,
  add column if not exists national_id_number text,
  add column if not exists code_bu text,
  add column if not exists bu_full_name text,
  add column if not exists handle_bu text,
  add column if not exists division text,
  add column if not exists position text,
  add column if not exists site text,
  add column if not exists working_location text,
  add column if not exists working_hour text,
  add column if not exists total_working_days text,
  add column if not exists employment_type text default 'Full Time',
  add column if not exists start_date date,
  add column if not exists line_manager text,
  add column if not exists contract_type text default 'FDC',
  add column if not exists fdc_end_date date,
  add column if not exists hiring_status text default 'probation',
  add column if not exists basic_salary numeric(12,2),
  add column if not exists tax_method text default 'Resident',
  add column if not exists allowance text,
  add column if not exists bank_account_number text,
  add column if not exists bank_name text,
  add column if not exists nssf_number text,
  add column if not exists current_address text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_phone_number text,
  add column if not exists documents jsonb default '[]'::jsonb;

-- 2. Create indexes for performance and rapid search
create index if not exists idx_employees_employee_code on employees(employee_code);
create index if not exists idx_employees_code_bu on employees(code_bu);
create index if not exists idx_employees_national_id on employees(national_id_number);
create index if not exists idx_employees_nssf_number on employees(nssf_number);

-- 3. Backfill full_name and start_date where missing
update employees
set
  full_name = coalesce(full_name, trim(concat(first_name, ' ', last_name))),
  start_date = coalesce(start_date, case when join_date ~ '^\d{4}-\d{2}-\d{2}' then join_date::date else null end)
where full_name is null or start_date is null;
