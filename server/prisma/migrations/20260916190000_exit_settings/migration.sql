-- =========================================================================
-- Exit Settings Migration
-- Configurable Exit Types & Reason Types with Role-based Access Control
-- =========================================================================

-- 1. Create exit_types table
create table if not exists exit_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clean duplicates if any exist before adding unique constraint
delete from exit_types
where ctid not in (
  select min(ctid) from exit_types group by name
);

-- Add unique constraint if table already existed without it
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'exit_types_name_unique'
  ) then
    alter table exit_types add constraint exit_types_name_unique unique (name);
  end if;
end $$;

-- 2. Create exit_reason_types table
create table if not exists exit_reason_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clean duplicates if any exist before adding unique constraint
delete from exit_reason_types
where ctid not in (
  select min(ctid) from exit_reason_types group by name
);

-- Add unique constraint if table already existed without it
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'exit_reason_types_name_unique'
  ) then
    alter table exit_reason_types add constraint exit_reason_types_name_unique unique (name);
  end if;
end $$;

-- 3. Relax check constraints on employee_exits if present
alter table employee_exits drop constraint if exists employee_exits_exit_type_check;
alter table employee_exits drop constraint if exists employee_exits_reason_type_check;

-- 4. Add permission column to app_roles for role permission customization
alter table app_roles add column if not exists exit_manage_settings boolean not null default false;

-- 5. Seed default Exit Types matching business specifications
insert into exit_types (name, display_order, status)
values
  ('Cut Off', 1, 'active'),
  ('End Contract', 2, 'active'),
  ('Fail Probation', 3, 'active'),
  ('Reject to Join', 4, 'active'),
  ('Resignation', 5, 'active'),
  ('Suspension', 6, 'active'),
  ('Termination', 7, 'active'),
  ('Walk out', 8, 'active')
on conflict do nothing;

-- 6. Seed default Exit Reason Types
insert into exit_reason_types (name, display_order, status)
values
  ('Better Opportunity', 1, 'active'),
  ('Career Growth', 2, 'active'),
  ('Compensation / Salary', 3, 'active'),
  ('Contract Expiration', 4, 'active'),
  ('Family / Personal Matters', 5, 'active'),
  ('Health / Medical', 6, 'active'),
  ('Misconduct', 7, 'active'),
  ('Performance Issue', 8, 'active'),
  ('Personal Reasons', 9, 'active'),
  ('Relocation', 10, 'active'),
  ('Restructuring / Layoff', 11, 'active'),
  ('Retirement', 12, 'active'),
  ('Other', 13, 'active')
on conflict do nothing;

-- 7. Enable RLS
alter table exit_types enable row level security;
alter table exit_reason_types enable row level security;

drop policy if exists "Authenticated users can read exit_types" on exit_types;
create policy "Authenticated users can read exit_types"
  on exit_types for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert exit_types" on exit_types;
create policy "Authenticated users can insert exit_types"
  on exit_types for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update exit_types" on exit_types;
create policy "Authenticated users can update exit_types"
  on exit_types for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete exit_types" on exit_types;
create policy "Authenticated users can delete exit_types"
  on exit_types for delete using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read exit_reason_types" on exit_reason_types;
create policy "Authenticated users can read exit_reason_types"
  on exit_reason_types for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert exit_reason_types" on exit_reason_types;
create policy "Authenticated users can insert exit_reason_types"
  on exit_reason_types for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update exit_reason_types" on exit_reason_types;
create policy "Authenticated users can update exit_reason_types"
  on exit_reason_types for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete exit_reason_types" on exit_reason_types;
create policy "Authenticated users can delete exit_reason_types"
  on exit_reason_types for delete using (auth.role() = 'authenticated');
