-- =========================================================================
-- Employee Exit Management
-- Records formal exits when employees leave the company
-- =========================================================================

create table if not exists employee_exits (
  id                  uuid primary key default gen_random_uuid(),
  employee_id         uuid references employees(id) on delete set null,
  exit_type           text not null check (exit_type in (
                        'resignation','termination','retirement',
                        'contract_end','abandonment','mutual_agreement','death'
                      )),
  last_working_day    date not null,
  reason_type         text not null check (reason_type in (
                        'personal','better_opportunity','health','performance',
                        'misconduct','restructuring','relocation','retirement',
                        'contract_end','other'
                      )),
  reason_description  text,
  document_url        text,
  document_name       text,
  status              text not null default 'active' check (status in ('active','cancelled')),
  recorded_by         text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_employee_exits_employee_id    on employee_exits(employee_id);
create index if not exists idx_employee_exits_last_working_day on employee_exits(last_working_day desc);
create index if not exists idx_employee_exits_exit_type      on employee_exits(exit_type);

-- RLS
alter table employee_exits enable row level security;

create policy "Authenticated users can read exits"
  on employee_exits for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert exits"
  on employee_exits for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update exits"
  on employee_exits for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete exits"
  on employee_exits for delete
  using (auth.role() = 'authenticated');
