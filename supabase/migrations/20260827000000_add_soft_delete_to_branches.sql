-- Add soft delete columns to branches so super admin can delete
-- branches and restore them from the Recycle Bin.

alter table branches add column if not exists deleted_at timestamptz;
alter table branches add column if not exists deleted_by text;
