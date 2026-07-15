-- The frontend only ever reads/writes branches.manager_name (plain text),
-- never a manager_id relationship. The manager_id FK added in the initial
-- migration created a second employees<->branches relationship alongside
-- employees.branch_id, which made PostgREST refuse to auto-resolve any
-- `employees(..., branches(name))` embed (PGRST201: ambiguous relationship).
-- Drop it and backfill manager_name from the data manager_id had captured.

update branches b
set manager_name = trim(e.first_name || ' ' || e.last_name)
from employees e
where e.id = b.manager_id;

alter table branches drop column manager_id;
