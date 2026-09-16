-- =========================================================================
-- Detailed NSSF (National Social Security Fund) Registration Fields
-- =========================================================================

alter table employees
  add column if not exists register_nssf boolean default false,
  add column if not exists nssf_number text,
  add column if not exists nssf_joining_date date,
  add column if not exists nssf_first_name_kh text,
  add column if not exists nssf_last_name_kh text,
  add column if not exists nssf_first_name_latin text,
  add column if not exists nssf_last_name_latin text,
  add column if not exists nssf_monthly_wage_type text default 'Formula',
  add column if not exists nssf_monthly_wage text default 'Taxable Salary',
  add column if not exists nssf_seniority_pension_fund text,
  add column if not exists nssf_remark text,
  add column if not exists nssf_status text default 'Active';

create index if not exists idx_employees_nssf_number on employees(nssf_number);
