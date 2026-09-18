-- Migration: Add Warning Management fields to disciplinary_records
-- Supports: Warning Type, Warning Date, Description, Action to Take, Employee Promise, Remark, and File Attachment

alter table disciplinary_records
  add column if not exists warning_type text,
  add column if not exists warning_date date,
  add column if not exists action_to_take text,
  add column if not exists employee_promise text,
  add column if not exists remark text,
  add column if not exists document_url text,
  add column if not exists document_name text;

-- Remove rigid constraint on type if exists so custom progressive warning types can be used
alter table disciplinary_records drop constraint if exists disciplinary_records_type_check;

-- Indexes for performance
create index if not exists idx_disciplinary_records_warning_date on disciplinary_records(warning_date);
create index if not exists idx_disciplinary_records_warning_type on disciplinary_records(warning_type);
create index if not exists idx_disciplinary_records_employee_date on disciplinary_records(employee_id, incident_date desc);
