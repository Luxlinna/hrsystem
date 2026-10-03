-- Same problem as Self-Service: /leave shows every employee's leave
-- requests plus Approve/Reject controls to anyone with the "leave" module,
-- including plain Employee/Staff accounts. Add a per-role override (default
-- off) so only roles that actually approve leave keep the full view; add a
-- leave day entitlement so individuals can see their own remaining balance.

alter table app_roles add column if not exists leave_view_all_employees boolean not null default false;
alter table employees add column if not exists annual_leave_days int not null default 18;

-- Roles whose job is to review/approve leave keep full visibility by default.
update app_roles set leave_view_all_employees = true
where name in ('HR Manager', 'Department Manager', 'HR Staff', 'CEO');
