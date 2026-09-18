-- =========================================================================
-- Warning Settings Migration
-- Configurable Warning Types with Alert Days & Role-based Access Control
-- =========================================================================

-- 1. Create warning_types table
create table if not exists warning_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alert_days_after int not null default 0,
  stop_alert_days int not null default 0,
  remark text default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deduplicate before adding unique constraint if table already existed
delete from warning_types
where ctid not in (
  select min(ctid) from warning_types group by name
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'warning_types_name_unique'
  ) then
    alter table warning_types add constraint warning_types_name_unique unique (name);
  end if;
end $$;

-- 2. Add permission column to app_roles
alter table app_roles add column if not exists disciplinary_manage_settings boolean not null default false;

-- 3. Seed default warning types matching business specifications
insert into warning_types (name, alert_days_after, stop_alert_days, remark, display_order, status)
values
  ('Instruction', 3, 1, 'For minor mistkes!', 1, 'active'),
  ('Verbal', 7, 3, 'A verbal warning is a disciplinary action issued to employees to improve or change their work or behavior in the workplace.', 2, 'active'),
  ('First Written', 7, 3, 'A written warning is a serious disciplinary action taken in a form of documentation.', 3, 'active'),
  ('Second Written', 7, 3, 'The employment contract shall be ended if no improvement.', 4, 'active'),
  ('Final Warning', 7, 7, 'Final warning', 5, 'active'),
  ('Notice', 0, 0, '', 6, 'active'),
  ('Suspense', 0, 0, '', 7, 'active')
on conflict (name) do nothing;

-- 4. Enable RLS
alter table warning_types enable row level security;

drop policy if exists "Authenticated users can read warning_types" on warning_types;
create policy "Authenticated users can read warning_types"
  on warning_types for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert warning_types" on warning_types;
create policy "Authenticated users can insert warning_types"
  on warning_types for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update warning_types" on warning_types;
create policy "Authenticated users can update warning_types"
  on warning_types for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete warning_types" on warning_types;
create policy "Authenticated users can delete warning_types"
  on warning_types for delete using (auth.role() = 'authenticated');
