-- Employee Directory deletions are recoverable through the Recycle Bin.
alter table employees add column if not exists deleted_at timestamptz;
alter table employees add column if not exists deleted_by text;

create index if not exists employees_deleted_at_idx on employees (deleted_at);
