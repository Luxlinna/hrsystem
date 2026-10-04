-- Daily work log ("what did I do today") — a personal diary of work
-- entries an employee adds themselves, with day/week/month/year report
-- views. Lives as a new Self-Service tab, so it automatically inherits
-- that module's existing "Switch Employee" mechanism for any role that
-- already has self_service_all_employees — no new permission columns
-- needed.

create table if not exists work_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  log_date date not null,
  start_time time,
  end_time time,
  activity text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists work_logs_employee_date_idx on work_logs(employee_id, log_date);

alter table work_logs enable row level security;
drop policy if exists "authenticated_full_access" on work_logs;
create policy "authenticated_full_access" on work_logs for all to authenticated using (true) with check (true);
