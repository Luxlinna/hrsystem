-- Migration: NSSF Management Enhancements for employees
-- Adds nationality, nssf_card_url, and indexes for fast NSSF lookup

alter table employees
  add column if not exists kh_name text,
  add column if not exists nssf_number text,
  add column if not exists gender text check (gender in ('Male', 'Female', 'Other')),
  add column if not exists date_of_birth date,
  add column if not exists basic_salary numeric(12,2),
  add column if not exists nationality text default 'Cambodian',
  add column if not exists nssf_card_url text;

-- Indexes for fast search
create index if not exists idx_employees_nssf_number on employees(nssf_number);
create index if not exists idx_employees_kh_name on employees(kh_name);

-- Backfill basic_salary from latest payroll_records where employees.basic_salary is null
update employees e
set basic_salary = p.base_salary
from (
  select distinct on (employee_id) employee_id, base_salary
  from payroll_records
  where base_salary is not null and base_salary > 0
  order by employee_id, created_at desc
) p
where e.id = p.employee_id
  and (e.basic_salary is null or e.basic_salary = 0);

-- Backfill kh_name, nssf_number, date_of_birth, gender from candidates table where linked
update employees e
set
  kh_name = coalesce(e.kh_name, c.kh_name),
  nssf_number = coalesce(e.nssf_number, c.nssf_number),
  gender = coalesce(e.gender, c.gender),
  date_of_birth = coalesce(e.date_of_birth, c.date_of_birth::date),
  basic_salary = coalesce(e.basic_salary, c.basic_salary)
from candidates c
where e.candidate_id = c.id
   or (e.email is not null and e.email != '' and lower(e.email) = lower(c.email))
   or (e.phone is not null and e.phone != '' and e.phone = c.phone);
