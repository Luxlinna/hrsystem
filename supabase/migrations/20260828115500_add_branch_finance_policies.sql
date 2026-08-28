-- Create branch_finance_policies table
create table if not exists branch_finance_policies (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade unique,
  monthly_budget_limit numeric(14,2) not null default 50000.00,
  auto_approve_threshold numeric(12,2) not null default 100.00,
  receipt_required_above numeric(12,2) not null default 25.00,
  currency text not null default 'USD',
  require_two_approvers_above numeric(12,2) not null default 500.00,
  allowed_categories text[] not null default array['Travel','Meals','Office Supplies','Software','Equipment','Training','Utilities','Marketing','Other'],
  policy_notes text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_branch_finance_policies_branch_id on branch_finance_policies(branch_id);

-- Enable RLS
alter table branch_finance_policies enable row level security;

drop policy if exists "Allow read branch_finance_policies for authenticated" on branch_finance_policies;
drop policy if exists "Allow insert branch_finance_policies for authenticated" on branch_finance_policies;
drop policy if exists "Allow update branch_finance_policies for authenticated" on branch_finance_policies;

create policy "Allow read branch_finance_policies for authenticated"
  on branch_finance_policies for select
  to authenticated
  using (true);

create policy "Allow insert branch_finance_policies for authenticated"
  on branch_finance_policies for insert
  to authenticated
  with check (true);

create policy "Allow update branch_finance_policies for authenticated"
  on branch_finance_policies for update
  to authenticated
  using (true);
