-- Extend the same "own record only + admin-configurable override" pattern
-- (already applied to Self-Service and Leave) to Payroll, Attendance,
-- Performance, and Disciplinary — all pages that otherwise show every
-- employee's sensitive personal data to anyone holding that module.

alter table app_roles add column if not exists payroll_view_all_employees boolean not null default false;
alter table app_roles add column if not exists attendance_view_all_employees boolean not null default false;
alter table app_roles add column if not exists performance_view_all_employees boolean not null default false;
alter table app_roles add column if not exists disciplinary_view_all_employees boolean not null default false;

-- Roles whose job is to process/approve these on behalf of others keep full
-- visibility by default; individual-contributor roles (Employee, Staff) see
-- only their own records unless an admin flips the override on.
update app_roles set payroll_view_all_employees = true where name in ('HR Manager', 'CEO');
update app_roles set attendance_view_all_employees = true where name in ('HR Manager', 'Department Manager', 'HR Staff', 'CEO');
update app_roles set performance_view_all_employees = true where name in ('HR Manager', 'Department Manager', 'HR Staff', 'CEO');
update app_roles set disciplinary_view_all_employees = true where name in ('HR Manager', 'Department Manager', 'HR Staff', 'CEO');
