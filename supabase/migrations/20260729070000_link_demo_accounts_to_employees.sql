-- Give each of the 9 demo login accounts a matching `employees` row so the
-- Profile page's "Job Details" section (job title, department, branch,
-- status, tenure, reports-to) has something to show out of the box. Without
-- this, only real deployments (where login email == HR employee email)
-- would ever see that section populated.

do $$
declare
  hq_id uuid := (select id from branches order by created_at limit 1);
  chairman_id uuid;
  ceo_id uuid;
  hr_manager_id uuid;
  dept_manager_id uuid;
begin
  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date)
  values ('Sovan', 'Ly', 'admin@hrnexus.com', 'System Administrator', 'IT', hq_id, 'active', '2022-01-10');

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date)
  values ('Bunroeun', 'Prak', 'chairman@hrnexus.com', 'Chairman', 'Executive', hq_id, 'active', '2020-01-01')
  returning id into chairman_id;

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Dara', 'Kim', 'ceo@hrnexus.com', 'Chief Executive Officer', 'Executive', hq_id, 'active', '2020-06-01', chairman_id)
  returning id into ceo_id;

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Vuthy', 'Chhun', 'adminmanager@hrnexus.com', 'Admin Manager', 'IT', hq_id, 'active', '2021-09-12', ceo_id);

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Sreymom', 'Nou', 'deptmanager@hrnexus.com', 'Department Manager', 'Operations', hq_id, 'active', '2021-11-03', ceo_id)
  returning id into dept_manager_id;

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Kunthea', 'Sar', 'manager@hrnexus.com', 'HR Manager', 'HR', hq_id, 'active', '2022-02-14', ceo_id)
  returning id into hr_manager_id;

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Pisey', 'Thorn', 'hrstaff@hrnexus.com', 'HR Staff', 'HR', hq_id, 'active', '2023-04-01', hr_manager_id);

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Vannak', 'Ros', 'employee@hrnexus.com', 'Demo Employee', 'Operations', hq_id, 'active', '2023-07-18', dept_manager_id);

  insert into employees (first_name, last_name, email, role, department, branch_id, status, join_date, reports_to)
  values ('Chanlina', 'Seng', 'staff@hrnexus.com', 'General Staff', 'Operations', hq_id, 'active', '2023-09-05', dept_manager_id);
end $$;
