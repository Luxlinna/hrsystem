-- The "Employee" role (an individual-contributor, self-service-only role
-- per its own description) had self_service_all_employees = true, while
-- every actual HR-authority role had it false — exactly backwards. This
-- let any regular Employee account use the "Switch Employee" picker in
-- Self-Service to browse every other employee's payslips, leave, and
-- attendance, including the Chairman's. Fix the scoping: only roles with
-- real HR authority over employee records can look up someone else's
-- self-service data (matches the employees_manage grant).

update app_roles set self_service_all_employees = false where name = 'Employee';
update app_roles set self_service_all_employees = true where name in ('HR Manager', 'CEO', 'HR Staff');
