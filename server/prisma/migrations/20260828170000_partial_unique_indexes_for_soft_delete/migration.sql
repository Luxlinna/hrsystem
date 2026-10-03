-- 1. Deduplicate user_role_assignments where deleted_at is null before creating the index
-- Keeps the most recently updated or user_id-linked row for each email
delete from user_role_assignments a
using user_role_assignments b
where lower(trim(a.email)) = lower(trim(b.email))
  and a.deleted_at is null
  and b.deleted_at is null
  and (
    -- If one has user_id and the other does not, delete the one without user_id
    (a.user_id is null and b.user_id is not null)
    -- Or if both have or don't have user_id, keep the higher id (newer row)
    or (
      ((a.user_id is not null and b.user_id is not null) or (a.user_id is null and b.user_id is null))
      and a.id < b.id
    )
  );

-- 2. Deduplicate employees where deleted_at is null (if any duplicates exist)
delete from employees a
using employees b
where lower(trim(a.email)) = lower(trim(b.email))
  and a.deleted_at is null
  and b.deleted_at is null
  and a.id < b.id;

-- 3. Employees partial unique index
alter table employees drop constraint if exists employees_email_key;
drop index if exists employees_email_unique_idx;
create unique index if not exists employees_email_unique_idx on employees (lower(trim(email))) where deleted_at is null;

-- 4. User Role Assignments partial unique index
alter table user_role_assignments drop constraint if exists user_role_assignments_email_key;
drop index if exists user_role_assignments_email_unique_idx;
create unique index if not exists user_role_assignments_email_unique_idx on user_role_assignments (lower(trim(email))) where deleted_at is null;
