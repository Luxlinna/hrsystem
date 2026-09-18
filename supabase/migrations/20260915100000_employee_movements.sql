-- =========================================================================
-- Employee Movements / Personnel Action Tracking
-- Tracks: Probation, Pass Probation, Transfer, Promote, Demote,
--         Salary Adjustment, Change Contract
-- =========================================================================

create table if not exists employee_movements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  movement_type text not null check (
    movement_type in (
      'probation',
      'pass_probation',
      'transfer',
      'promote',
      'demote',
      'salary_adjustment',
      'change_contract'
    )
  ),
  title text not null,
  effective_date date not null default current_date,
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  remarks text,
  document_url text,
  document_name text,
  branch_id uuid references branches(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_employee_movements_employee_id on employee_movements(employee_id);
create index if not exists idx_employee_movements_branch_id on employee_movements(branch_id);
create index if not exists idx_employee_movements_effective_date on employee_movements(effective_date);
create index if not exists idx_employee_movements_movement_type on employee_movements(movement_type);

-- Enable RLS
alter table employee_movements enable row level security;

-- Policies
create policy "Allow read access to employee movements for authenticated users"
  on employee_movements for select
  to authenticated
  using (deleted_at is null);

create policy "Allow insert access to employee movements for authenticated users"
  on employee_movements for insert
  to authenticated
  with check (true);

create policy "Allow update access to employee movements for authenticated users"
  on employee_movements for update
  to authenticated
  using (true)
  with check (true);
