-- Automatically cascade branch soft-deletion & restoration to employees, user role assignments, and work locations

create or replace function public.handle_branch_soft_delete_cascade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. When branch is deleted (moved to Recycle Bin)
  if (new.deleted_at is not null and old.deleted_at is null) then
    -- Cascade soft-delete employees in this branch
    update employees
    set deleted_at = new.deleted_at,
        deleted_by = new.deleted_by,
        status = 'inactive'
    where branch_id = new.id
      and deleted_at is null;

    -- Cascade soft-delete user role assignments (deactivates their login access)
    update user_role_assignments
    set deleted_at = new.deleted_at,
        deleted_by = new.deleted_by
    where email in (
      select lower(email) from employees where branch_id = new.id
    )
    and deleted_at is null;

    -- Cascade soft-delete work locations
    update work_locations
    set deleted_at = new.deleted_at
    where branch_id = new.id
      and deleted_at is null;

  -- 2. When branch is restored from Recycle Bin
  elsif (new.deleted_at is null and old.deleted_at is not null) then
    -- Restore employees that were deleted with the branch
    update employees
    set deleted_at = null,
        deleted_by = null,
        status = 'active'
    where branch_id = new.id
      and deleted_at = old.deleted_at;

    -- Restore user role assignments
    update user_role_assignments
    set deleted_at = null,
        deleted_by = null
    where email in (
      select lower(email) from employees where branch_id = new.id
    )
    and deleted_at = old.deleted_at;

    -- Restore work locations
    update work_locations
    set deleted_at = null
    where branch_id = new.id
      and deleted_at = old.deleted_at;
  end if;

  return new;
end;
$$;

-- Drop trigger if already exists and recreate
drop trigger if exists trg_branch_soft_delete_cascade on branches;

create trigger trg_branch_soft_delete_cascade
after update of deleted_at on branches
for each row
execute function public.handle_branch_soft_delete_cascade();
