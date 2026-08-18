alter table unity_apps add column if not exists deleted_at timestamptz;
alter table unity_apps add column if not exists deleted_by text;
