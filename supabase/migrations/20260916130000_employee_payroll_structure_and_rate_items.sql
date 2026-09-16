-- =========================================================================
-- Employee Payroll Structure, Tax Salary, Rate Items & Payroll Attachments
-- =========================================================================

alter table employees
  add column if not exists payroll_structure text default 'Standard Monthly',
  add column if not exists apply_day_in_month boolean default false,
  add column if not exists apply_working_hours_per_day boolean default false,
  add column if not exists tax_salary numeric(12,2),
  add column if not exists tax_salary_currency text default 'USD',
  add column if not exists tax_salary_frequency text default 'Monthly',
  add column if not exists rate_items jsonb default '[]'::jsonb,
  add column if not exists payroll_attachments jsonb default '[]'::jsonb;
