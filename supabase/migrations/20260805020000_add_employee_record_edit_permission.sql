-- The Employee Profile edit form (name, email, role, department, status,
-- reports-to) had no permission gate at all beyond "can view the
-- employees module" — so Branch Manager, whose authority per the role
-- description is limited to leave/attendance/performance/disciplinary
-- for their own branch, could silently rewrite ANY employee's role,
-- status, or manager company-wide. Add an explicit manage flag, off by
-- default, and grant it only to the roles with real HR authority over
-- employee records.

alter table app_roles add column if not exists employees_manage boolean not null default false;

update app_roles set employees_manage = true where name in ('HR Manager', 'CEO', 'HR Staff');
