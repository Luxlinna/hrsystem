-- Per-type annual leave entitlements, so the Submit Leave form can show
-- "how many days left" for every leave type, not just Annual (which already
-- has its own per-employee override via employees.annual_leave_days).
-- A null default_days means the type is uncapped (e.g. unpaid leave).

create table if not exists leave_type_policies (
  type text primary key check (type in ('sick','maternity','paternity','unpaid','bereavement','study')),
  default_days int,
  updated_at timestamptz not null default now()
);

alter table leave_type_policies enable row level security;
create policy "leave_type_policies_select" on leave_type_policies for select to authenticated using (true);

insert into leave_type_policies (type, default_days) values
  ('sick', 14),
  ('maternity', 90),
  ('paternity', 7),
  ('unpaid', null),
  ('bereavement', 5),
  ('study', 10)
on conflict (type) do nothing;
