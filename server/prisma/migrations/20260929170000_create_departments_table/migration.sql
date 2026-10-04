-- =========================================================================
-- Departments Table & Migration
-- Supports hierarchical departments with Parent Department, Head of Department,
-- Sort Order, Status, and Branch scoping.
-- =========================================================================

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  parent_department_id uuid references departments(id) on delete set null,
  parent_department_name text,
  head_of_department_id uuid references employees(id) on delete set null,
  head_of_department_name text,
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_departments_branch_id on departments(branch_id);
create index if not exists idx_departments_parent_id on departments(parent_department_id);
create index if not exists idx_departments_status on departments(status);
create index if not exists idx_departments_sort_order on departments(sort_order);

-- Enable RLS
alter table departments enable row level security;

-- RLS Policies
create policy "Allow all authenticated users to view departments"
  on departments for select
  to authenticated
  using (deleted_at is null);

create policy "Allow authenticated users to insert departments"
  on departments for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update departments"
  on departments for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete departments"
  on departments for delete
  to authenticated
  using (true);

-- Seed default departments if table is empty
do $$
declare
  hr_id uuid;
begin
  if not exists (select 1 from departments limit 1) then
    -- Insert HR first so Administration can reference it as Parent
    insert into departments (name, sort_order, status)
    values ('HUMAN RESOURCES', 4, 'active')
    returning id into hr_id;

    insert into departments (name, parent_department_id, parent_department_name, sort_order, status)
    values ('ADMINISTRATION', hr_id, 'HUMAN RESOURCES', 1, 'active');

    insert into departments (name, sort_order, status) values
      ('BUSINESS DEVELOPMENT', 2, 'active'),
      ('FINANCE AND ACCOUNTING', 3, 'active'),
      ('INFORMATION TECHNOLOGY (IT)', 5, 'active'),
      ('INTERNAL AUDIT AND LOSS PREVENTION', 6, 'active'),
      ('MANAGEMENT', 7, 'active'),
      ('MARKETING', 8, 'active'),
      ('MERCHANDISE', 9, 'active'),
      ('OPERATIONS', 10, 'active'),
      ('OPERATIONS KITCHEN', 11, 'active');
  end if;
end $$;
