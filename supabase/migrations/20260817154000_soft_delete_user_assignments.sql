-- User Management delete now moves account assignments to the Recycle Bin.
-- The Auth account is kept until an admin chooses "Delete forever" there.

alter table user_role_assignments add column if not exists deleted_at timestamptz;
alter table user_role_assignments add column if not exists deleted_by text;
