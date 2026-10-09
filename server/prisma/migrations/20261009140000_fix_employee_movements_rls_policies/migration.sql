-- =========================================================================
-- Fix Employee Movements RLS Policies
-- Allow anon, authenticated, and service_role to perform full CRUD on employee_movements
-- =========================================================================

-- Ensure table exists and has deleted_at column
create table if not exists employee_movements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  movement_type text not null,
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

-- Enable RLS
alter table employee_movements enable row level security;

-- Drop restrictive / existing policies if they exist
drop policy if exists "Allow read access to employee movements for authenticated users" on employee_movements;
drop policy if exists "Allow insert access to employee movements for authenticated users" on employee_movements;
drop policy if exists "Allow update access to employee movements for authenticated users" on employee_movements;
drop policy if exists "Allow delete access to employee movements for authenticated users" on employee_movements;
drop policy if exists "Allow all users to view employee_movements" on employee_movements;
drop policy if exists "Allow all users to insert employee_movements" on employee_movements;
drop policy if exists "Allow all users to update employee_movements" on employee_movements;
drop policy if exists "Allow all users to delete employee_movements" on employee_movements;
drop policy if exists "Allow all on employee_movements" on employee_movements;

-- Create comprehensive RLS policies
create policy "Allow all users to view employee_movements"
  on employee_movements for select
  using (deleted_at is null);

create policy "Allow all users to insert employee_movements"
  on employee_movements for insert
  with check (true);

create policy "Allow all users to update employee_movements"
  on employee_movements for update
  using (true)
  with check (true);

create policy "Allow all users to delete employee_movements"
  on employee_movements for delete
  using (true);

-- Grant table permissions to all roles
grant all on table employee_movements to anon, authenticated, service_role;
