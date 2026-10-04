-- Work locations: physical sites within a branch.
-- One branch can have many work locations (e.g. "Head Office", "Kandal Factory").
-- Employees can be assigned a default work location.
-- Attendance records track which site the employee was at on a given day.

-- 1. Remove the old checkin_branch_id column that was added by the previous
--    migration, so we start clean with the proper work_locations design.
alter table attendance_records
  drop column if exists checkin_branch_id;

-- 2. Create the work_locations table.
create table if not exists work_locations (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references branches(id) on delete cascade,
  name        text not null,
  description text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists work_locations_branch_id_idx on work_locations (branch_id);

-- RLS
alter table work_locations enable row level security;

-- All authenticated users can read work_locations
create policy "work_locations_select" on work_locations
  for select to authenticated using (deleted_at is null);

-- Only admins / service role can insert/update/delete (managed via Supabase dashboard or seed)
create policy "work_locations_insert" on work_locations
  for insert to authenticated
  with check (
    exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and (ar.is_admin = true or ar.name ilike '%admin%' or ar.name ilike '%manager%')
    )
  );

create policy "work_locations_update" on work_locations
  for update to authenticated
  using (
    exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and (ar.is_admin = true or ar.name ilike '%admin%' or ar.name ilike '%manager%')
    )
  );

-- 3. Add default work location to employees.
alter table employees
  add column if not exists default_work_location_id uuid references work_locations(id) on delete set null;

-- 4. Add work_location_id to attendance_records.
alter table attendance_records
  add column if not exists work_location_id uuid references work_locations(id) on delete set null;

create index if not exists attendance_records_work_location_id_idx
  on attendance_records (work_location_id);
