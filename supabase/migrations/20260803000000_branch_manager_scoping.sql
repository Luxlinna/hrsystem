-- Adds a real middle tier between "see everyone" and "see only yourself":
-- "see/manage only employees in my own branch". Previously the permission
-- model only had those two extremes, so "Department Manager" wasn't
-- actually scoped to a department/branch at all — it just saw everyone,
-- same as HR Manager for these modules.
--
-- Renames Department Manager -> Branch Manager and switches it from
-- company-wide visibility to branch-scoped visibility for the four
-- modules where "managing your own team" makes sense (leave, attendance,
-- performance, disciplinary). Payroll and Self-Service switching stay
-- self-only for this role, unchanged.

alter table app_roles
  add column if not exists leave_view_own_branch boolean not null default false,
  add column if not exists attendance_view_own_branch boolean not null default false,
  add column if not exists performance_view_own_branch boolean not null default false,
  add column if not exists disciplinary_view_own_branch boolean not null default false;

update app_roles
set
  name = 'Branch Manager',
  leave_view_all_employees = false,
  attendance_view_all_employees = false,
  performance_view_all_employees = false,
  disciplinary_view_all_employees = false,
  leave_view_own_branch = true,
  attendance_view_own_branch = true,
  performance_view_own_branch = true,
  disciplinary_view_own_branch = true
where name = 'Department Manager';
