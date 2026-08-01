-- Self-Service currently lets ANY logged-in user pick ANY employee from a
-- "Switch Employee" dropdown and view/act on their payslips, leave,
-- attendance, and clock in/out on their behalf — a real gap for a page
-- named "self-service". Default every role (staff and management alike) to
-- seeing only the employee record matching their own account email; add a
-- per-role override the Admin Portal can flip on for roles that should keep
-- cross-employee access (e.g. an HR assistant covering for others).
-- Super Admin is unaffected — it already bypasses everything via is_admin.

alter table app_roles add column if not exists self_service_all_employees boolean not null default false;
