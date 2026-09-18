-- =========================================================================
-- Employee Settings Migration
-- General Settings, Alerts, Auto Number, Employee Fields & Rate Items
-- =========================================================================

-- 1. Create employee_settings table (singleton record)
create table if not exists employee_settings (
  id text primary key default 'default',
  is_show_salary_type text not null default 'show' check (is_show_salary_type in ('show', 'hide')),
  employee_restrict_age int not null default 17,

  -- Identification expiration alerts (days before expiration)
  alert_passport_days int not null default 60,
  alert_driver_license_days int not null default 60,
  alert_visa_days int not null default 60,
  alert_work_permit_days int not null default 60,
  alert_national_id_days int not null default 60,

  -- Anniversary alerts
  alert_joining_days int not null default 45,
  alert_joining_recurring boolean not null default true,
  alert_birthday_days int not null default 30,
  alert_birthday_send_message boolean not null default false,

  -- Auto employee code configuration
  auto_employee_code_enabled boolean not null default true,
  auto_employee_code_prefix text default '',
  auto_employee_code_middle text default '',
  auto_employee_code_sequence int not null default 1889,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default row if not exists
insert into employee_settings (
  id, is_show_salary_type, employee_restrict_age,
  alert_passport_days, alert_driver_license_days, alert_visa_days, alert_work_permit_days, alert_national_id_days,
  alert_joining_days, alert_joining_recurring, alert_birthday_days, alert_birthday_send_message,
  auto_employee_code_enabled, auto_employee_code_prefix, auto_employee_code_middle, auto_employee_code_sequence
)
values (
  'default', 'show', 17,
  60, 60, 60, 60, 60,
  45, true, 30, false,
  true, '', '', 1889
)
on conflict (id) do nothing;

-- 2. Create employee_rate_items table
create table if not exists employee_rate_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_amount numeric(12,2) default 0,
  remark text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deduplicate before adding unique constraint if table already exists
delete from employee_rate_items
where ctid not in (
  select min(ctid) from employee_rate_items group by name
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'employee_rate_items_name_unique'
  ) then
    alter table employee_rate_items add constraint employee_rate_items_name_unique unique (name);
  end if;
end $$;

-- Seed default rate items
insert into employee_rate_items (name, default_amount, remark, display_order, status)
values
  ('Gasoline', 0, '', 1, 'active'),
  ('Attendance', 0, '', 2, 'active'),
  ('Accommodation', 0, '', 3, 'active'),
  ('Transportation', 0, 'Covering on transportation fees and maintenance.', 4, 'active'),
  ('Parking', 0, 'For staff at store PP0003 only - 6.5 USD!', 5, 'active'),
  ('Phone', 0, '', 6, 'active'),
  ('13th month salary', 0, 'Offer to specific employees with latest basic salary every anniversary.', 7, 'active'),
  ('N.OT Allowance', 0, 'An allowance is provided to an employee for 1 time normal OT.', 8, 'active'),
  ('Position', 0, '', 9, 'active')
on conflict (name) do nothing;

-- 3. Create employee_field_settings table
create table if not exists employee_field_settings (
  id uuid primary key default gen_random_uuid(),
  field_key text not null,
  field_label text not null,
  is_required boolean not null default false,
  is_enabled boolean not null default true,
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deduplicate before adding unique constraint
delete from employee_field_settings
where ctid not in (
  select min(ctid) from employee_field_settings group by field_key
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'employee_field_settings_key_unique'
  ) then
    alter table employee_field_settings add constraint employee_field_settings_key_unique unique (field_key);
  end if;
end $$;

-- Seed default employee fields
insert into employee_field_settings (field_key, field_label, is_required, is_enabled, display_order)
values
  ('kh_name', 'Khmer Name', false, true, 1),
  ('nssf_number', 'NSSF Number', false, true, 2),
  ('passport_number', 'Passport Number', false, true, 3),
  ('driving_license', 'Driving License', false, true, 4),
  ('bank_account', 'Bank Account Info', false, true, 5),
  ('emergency_contact', 'Emergency Contact', false, true, 6),
  ('biometric_id', 'Biometric User ID', false, true, 7),
  ('tax_salary', 'Tax Salary', false, true, 8)
on conflict (field_key) do nothing;

-- 4. Add permission column to app_roles
alter table app_roles add column if not exists employee_manage_settings boolean not null default false;

-- 5. Enable RLS
alter table employee_settings enable row level security;
alter table employee_rate_items enable row level security;
alter table employee_field_settings enable row level security;

-- employee_settings policies
drop policy if exists "Authenticated users can read employee_settings" on employee_settings;
create policy "Authenticated users can read employee_settings"
  on employee_settings for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert employee_settings" on employee_settings;
create policy "Authenticated users can insert employee_settings"
  on employee_settings for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update employee_settings" on employee_settings;
create policy "Authenticated users can update employee_settings"
  on employee_settings for update using (auth.role() = 'authenticated');

-- employee_rate_items policies
drop policy if exists "Authenticated users can read employee_rate_items" on employee_rate_items;
create policy "Authenticated users can read employee_rate_items"
  on employee_rate_items for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert employee_rate_items" on employee_rate_items;
create policy "Authenticated users can insert employee_rate_items"
  on employee_rate_items for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update employee_rate_items" on employee_rate_items;
create policy "Authenticated users can update employee_rate_items"
  on employee_rate_items for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete employee_rate_items" on employee_rate_items;
create policy "Authenticated users can delete employee_rate_items"
  on employee_rate_items for delete using (auth.role() = 'authenticated');

-- employee_field_settings policies
drop policy if exists "Authenticated users can read employee_field_settings" on employee_field_settings;
create policy "Authenticated users can read employee_field_settings"
  on employee_field_settings for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert employee_field_settings" on employee_field_settings;
create policy "Authenticated users can insert employee_field_settings"
  on employee_field_settings for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update employee_field_settings" on employee_field_settings;
create policy "Authenticated users can update employee_field_settings"
  on employee_field_settings for update using (auth.role() = 'authenticated');
