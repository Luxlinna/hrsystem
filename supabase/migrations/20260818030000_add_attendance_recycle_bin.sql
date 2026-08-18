alter table attendance_records add column if not exists deleted_at timestamptz;
alter table attendance_records add column if not exists deleted_by text;
