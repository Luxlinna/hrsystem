-- Make the remaining recoverable business-record delete actions use the Recycle Bin.
alter table attendance_records add column if not exists deleted_at timestamptz;
alter table attendance_records add column if not exists deleted_by text;
alter table onboarding_documents add column if not exists deleted_at timestamptz;
alter table onboarding_documents add column if not exists deleted_by text;

create index if not exists attendance_records_deleted_at_idx on attendance_records (deleted_at);
create index if not exists onboarding_documents_deleted_at_idx on onboarding_documents (deleted_at);
