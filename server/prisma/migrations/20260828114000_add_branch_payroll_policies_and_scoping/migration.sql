-- Add branch_id to payroll_runs and payroll_records
alter table payroll_runs add column if not exists branch_id uuid references branches(id) on delete set null;
alter table payroll_records add column if not exists branch_id uuid references branches(id) on delete set null;

create index if not exists idx_payroll_runs_branch_id on payroll_runs(branch_id);
create index if not exists idx_payroll_records_branch_id on payroll_records(branch_id);

-- Backfill branch_id on payroll_records from employees
update payroll_records p
set branch_id = e.branch_id
from employees e
where p.employee_id = e.id and p.branch_id is null and e.branch_id is not null;

-- Create branch_payroll_policies table for branch-specific payroll configuration and policy rules
create table if not exists branch_payroll_policies (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade unique,
  pay_cycle text not null default 'monthly' check (pay_cycle in ('monthly','bi-weekly','semi-monthly','weekly')),
  pay_day int not null default 28 check (pay_day between 1 and 31),
  cutoff_day int not null default 25 check (cutoff_day between 1 and 31),
  overtime_rate numeric(4,2) not null default 1.50,
  tax_rate numeric(4,2) not null default 5.00,
  social_security_rate numeric(4,2) not null default 4.00,
  health_insurance_rate numeric(4,2) not null default 2.00,
  currency text not null default 'USD',
  disbursement_method text not null default 'bank_transfer' check (disbursement_method in ('bank_transfer','cash','cheque','direct_deposit')),
  bank_name text,
  bank_account_number text,
  requires_two_tier_approval boolean not null default true,
  auto_calculate_overtime boolean not null default true,
  auto_deduct_late_penalties boolean not null default false,
  policy_notes text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_branch_payroll_policies_branch_id on branch_payroll_policies(branch_id);

-- Enable RLS
alter table branch_payroll_policies enable row level security;

drop policy if exists "Allow read branch_payroll_policies for authenticated" on branch_payroll_policies;
drop policy if exists "Allow insert branch_payroll_policies for authenticated" on branch_payroll_policies;
drop policy if exists "Allow update branch_payroll_policies for authenticated" on branch_payroll_policies;

create policy "Allow read branch_payroll_policies for authenticated"
  on branch_payroll_policies for select
  to authenticated
  using (true);

create policy "Allow insert branch_payroll_policies for authenticated"
  on branch_payroll_policies for insert
  to authenticated
  with check (true);

create policy "Allow update branch_payroll_policies for authenticated"
  on branch_payroll_policies for update
  to authenticated
  using (true);
