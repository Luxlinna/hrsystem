-- Task management, available to every role: individual contributors track
-- and manage their own tasks; managers (the same set of roles that already
-- have company-wide or branch-scoped visibility elsewhere — CEO, HR
-- Manager, HR Staff, Branch Manager) can additionally assign tasks to and
-- report on the people they manage. Mirrors the exact scoping pattern
-- already used for leave/attendance/performance/disciplinary.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid not null references employees(id) on delete cascade,
  assigned_by uuid not null references employees(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_assigned_to_idx on tasks(assigned_to);
create index if not exists tasks_status_idx on tasks(status);

alter table tasks enable row level security;
drop policy if exists "authenticated_full_access" on tasks;
create policy "authenticated_full_access" on tasks for all to authenticated using (true) with check (true);

alter table app_roles
  add column if not exists task_view_all_employees boolean not null default false,
  add column if not exists task_view_own_branch boolean not null default false;

update app_roles set task_view_all_employees = true where name in ('CEO', 'HR Manager', 'HR Staff');
update app_roles set task_view_own_branch = true where name = 'Branch Manager';

-- Give every role the module itself; scope (own-only vs. team) is what
-- actually differs, same as Self-Service/Leave/etc.
update app_roles
set allowed_modules = allowed_modules || '{tasks}'::text[]
where not (allowed_modules @> '{tasks}'::text[])
  and not (allowed_modules @> '{"*"}'::text[]);
