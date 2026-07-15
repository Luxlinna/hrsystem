-- Seed data: roles/auth linking, branches, employees, and realistic demo
-- data across every module the frontend reads from.

-- =========================================================================
-- RBAC roles + link the 3 demo Supabase Auth accounts created via Admin API
-- =========================================================================
insert into app_roles (name, description, color, is_admin, allowed_modules) values
  ('Super Admin', 'Full access to every module', '#0D7377', true, array['*']),
  ('HR Manager', 'Manages workforce, hiring, and payroll operations', '#7C3AED',
    false, array['dashboard','employees','branches','analytics','onboarding','onboarding-checklist','leave','leave-calendar','hire','offboard','org-chart','performance','attendance','training','disciplinary','shifts','payroll','payroll-approval','benefits','announcements','documents','reports','self-service','notifications']),
  ('Employee', 'Self-service access only', '#059669',
    false, array['dashboard','self-service','leave','leave-calendar','notifications','announcements','training']);

insert into user_role_assignments (user_id, email, display_name, role_id)
select '945c5681-1b83-4705-aa01-7f3591c81fdd'::uuid, 'admin@hrnexus.com', 'Admin User', id from app_roles where name = 'Super Admin';
insert into user_role_assignments (user_id, email, display_name, role_id)
select '32aaf32d-00b4-4bb4-8c46-d245bfd56b4d'::uuid, 'manager@hrnexus.com', 'HR Manager', id from app_roles where name = 'HR Manager';
insert into user_role_assignments (user_id, email, display_name, role_id)
select 'bbdc857d-3d9b-4f8d-9baa-da1a995d506d'::uuid, 'employee@hrnexus.com', 'Demo Employee', id from app_roles where name = 'Employee';

-- =========================================================================
-- Branches (Phnom Penh HQ + 10 branches)
-- =========================================================================
insert into branches (name, location, status, employee_count) values
  ('Phnom Penh HQ', 'Phnom Penh, Cambodia', 'active', 0),
  ('Siem Reap Branch', 'Siem Reap, Cambodia', 'active', 0),
  ('Battambang Branch', 'Battambang, Cambodia', 'active', 0),
  ('Sihanoukville Branch', 'Preah Sihanouk, Cambodia', 'active', 0),
  ('Kampong Cham Branch', 'Kampong Cham, Cambodia', 'active', 0),
  ('Kampot Branch', 'Kampot, Cambodia', 'active', 0),
  ('Kep Branch', 'Kep, Cambodia', 'active', 0),
  ('Kratie Branch', 'Kratie, Cambodia', 'active', 0),
  ('Poipet Branch', 'Banteay Meanchey, Cambodia', 'active', 0),
  ('Pursat Branch', 'Pursat, Cambodia', 'pending', 0),
  ('Takeo Branch', 'Takeo, Cambodia', 'inactive', 0);

-- =========================================================================
-- Employees
-- =========================================================================
do $$
declare
  branch_ids uuid[] := array(select id from branches order by created_at);
  hq_id uuid := branch_ids[1];
  first_names text[] := array['Dara','Sopheak','Vibol','Chenda','Sreymom','Bopha','Rithy','Sokha','Pisey','Vannak',
    'Chantha','Sokunthea','Ratanak','Kunthea','Panha','Sovann','Malis','Vuthy','Sreyneang','Mony',
    'Pheakdey','Reaksmey','Sotheara','Channary','Kimhak','Sreyroth','Bunthoeun','Chanlina','Piseth','Dalin',
    'Veasna','Sreynich','Makara','Kolab','Thida','Sambath','Chanraksmey','Sreypov','Vichet','Sopheaktra'];
  last_names text[] := array['Sok','Chan','Heng','Kim','Meas','Prak','Chea','Long','Nou','Yim',
    'Pich','Vann','Ly','Sar','Suon','Thorn','Kong','Ros','Chhun','Tep','Ouch','Seng','Nhek','Khun','Doung'];
  departments text[] := array['HR','IT','Finance','Sales','Marketing','Operations','Engineering','Customer Service','Legal'];
  roles_by_dept jsonb := '{
    "HR": ["HR Specialist","HR Coordinator","Recruiter","HR Manager"],
    "IT": ["Software Engineer","IT Support Specialist","DevOps Engineer","IT Manager","QA Engineer"],
    "Finance": ["Accountant","Financial Analyst","Finance Manager","Payroll Specialist"],
    "Sales": ["Sales Executive","Account Manager","Sales Manager","Business Development Rep"],
    "Marketing": ["Marketing Specialist","Content Creator","Marketing Manager","SEO Specialist"],
    "Operations": ["Operations Coordinator","Logistics Manager","Operations Manager"],
    "Engineering": ["Backend Engineer","Frontend Engineer","Engineering Manager","Site Reliability Engineer"],
    "Customer Service": ["Customer Support Agent","Customer Success Manager"],
    "Legal": ["Legal Counsel","Compliance Officer"]
  }'::jsonb;
  statuses text[] := array['active','active','active','active','active','active','active','on_leave','onboarding','inactive'];
  dept text;
  role_options text[];
  b_id uuid;
  emp_id uuid;
  i int;
  n_employees int;
  branch_first_emp uuid;
  fname text;
  lname text;
  email_local text;
begin
  -- Executives at HQ
  insert into employees (first_name, last_name, email, phone, role, department, branch_id, status, join_date)
  values
    ('Sokha','Meas','sokha.meas@hrnexus.com','+855 12 111 001','CEO','Executive', hq_id, 'active', '2018-01-15'),
    ('Vibol','Chan','vibol.chan@hrnexus.com','+855 12 111 002','COO','Executive', hq_id, 'active', '2018-03-01'),
    ('Chenda','Sok','chenda.sok@hrnexus.com','+855 12 111 003','CFO','Executive', hq_id, 'active', '2019-02-10'),
    ('Rithy','Heng','rithy.heng@hrnexus.com','+855 12 111 004','CTO','Executive', hq_id, 'active', '2019-06-20');

  foreach b_id in array branch_ids loop
    n_employees := case when b_id = hq_id then 12 else 6 end;
    branch_first_emp := null;
    for i in 1..n_employees loop
      dept := departments[1 + floor(random() * array_length(departments,1))::int];
      role_options := array(select jsonb_array_elements_text(roles_by_dept -> dept));
      fname := first_names[1 + floor(random() * array_length(first_names,1))::int];
      lname := last_names[1 + floor(random() * array_length(last_names,1))::int];
      email_local := lower(fname) || '.' || lower(lname) || floor(random()*900+100)::text;

      insert into employees (first_name, last_name, email, phone, role, department, branch_id, status, join_date, reports_to)
      values (
        fname, lname,
        email_local || '@hrnexus.com',
        '+855 ' || (10 + floor(random()*80))::text || ' ' || (100 + floor(random()*900))::text || ' ' || (100 + floor(random()*900))::text,
        role_options[1 + floor(random() * array_length(role_options,1))::int],
        dept,
        b_id,
        statuses[1 + floor(random() * array_length(statuses,1))::int],
        (current_date - (floor(random()*1500))::int * interval '1 day')::date,
        branch_first_emp
      )
      returning id into emp_id;

      if branch_first_emp is null then
        branch_first_emp := emp_id;
      end if;
    end loop;
  end loop;

  -- branch manager + employee_count
  update branches b set
    manager_id = (select e.id from employees e where e.branch_id = b.id order by e.join_date asc limit 1),
    employee_count = (select count(*) from employees e where e.branch_id = b.id);
end $$;

-- =========================================================================
-- Onboarding (5 newest employees)
-- =========================================================================
do $$
declare
  emp record;
  req_id uuid;
  stages text[] := array['document','it_setup','training','complete'];
  stage_pick text;
begin
  for emp in
    select id, first_name from employees
    where status = 'onboarding'
       or id in (select id from employees order by join_date desc limit 5)
  loop
    stage_pick := stages[1 + floor(random()*4)::int];
    insert into onboarding_requests (employee_id, stage, day_count, status, requested_by)
    values (emp.id, stage_pick, floor(random()*20)::int, case when stage_pick = 'complete' then 'completed' else 'pending' end, 'HR Manager')
    returning id into req_id;

    insert into onboarding_documents (onboarding_request_id, employee_id, document_name, stage, status, uploaded_at)
    values
      (req_id, emp.id, 'ID Card Copy', 'document', 'complete', now() - interval '3 days'),
      (req_id, emp.id, 'Employment Contract', 'document', 'complete', now() - interval '2 days'),
      (req_id, emp.id, 'Bank Account Form', 'document', 'pending', null);

    insert into onboarding_checklist_tasks (onboarding_request_id, task_name, category, assigned_to_role, due_date, completed, priority, sort_order)
    values
      (req_id, 'Collect signed contract', 'documents', 'HR', current_date + 2, true, 'high', 1),
      (req_id, 'Provision laptop & accounts', 'it_setup', 'IT', current_date + 3, false, 'high', 2),
      (req_id, 'Assign onboarding buddy', 'general', 'HR', current_date + 1, true, 'medium', 3),
      (req_id, 'Complete orientation training', 'training', 'Training', current_date + 7, false, 'medium', 4);
  end loop;
end $$;

-- =========================================================================
-- Leave requests
-- =========================================================================
do $$
declare
  emp record;
  leave_types text[] := array['annual','sick','personal','maternity','unpaid'];
  statuses text[] := array['pending','approved','approved','approved','rejected'];
  d int;
  start_d date;
begin
  for emp in select id from employees where status in ('active','on_leave') order by random() limit 45 loop
    d := 1 + floor(random()*8)::int;
    start_d := current_date - (floor(random()*60) - 20)::int * interval '1 day';
    insert into leave_requests (employee_id, leave_type, start_date, end_date, days, status, reason)
    values (
      emp.id,
      leave_types[1 + floor(random()*array_length(leave_types,1))::int],
      start_d, start_d + (d-1) * interval '1 day', d,
      statuses[1 + floor(random()*array_length(statuses,1))::int],
      'Personal matters'
    );
  end loop;
end $$;

-- =========================================================================
-- Payroll
-- =========================================================================
do $$
declare
  emp record;
  base numeric;
  bonus numeric;
  ded numeric;
begin
  for emp in select id, role from employees where status in ('active','on_leave') loop
    base := case
      when emp.role ilike '%CEO%' or emp.role ilike '%CFO%' or emp.role ilike '%COO%' or emp.role ilike '%CTO%' then 3500
      when emp.role ilike '%Manager%' then 1800
      else 900
    end + floor(random()*300);
    bonus := round((base * (random()*0.15))::numeric, 2);
    ded := round((base * 0.08)::numeric, 2);
    insert into payroll_records (employee_id, month, base_salary, bonus, deductions, gross_pay, net_pay, status)
    values (emp.id, '2026-04', base, bonus, ded, base + bonus, base + bonus - ded, 'paid');
    insert into payroll_records (employee_id, month, base_salary, bonus, deductions, gross_pay, net_pay, status)
    values (emp.id, '2026-05', base, bonus, ded, base + bonus, base + bonus - ded, 'processed');
  end loop;
end $$;

with run1 as (
  insert into payroll_runs (period, department, total_base, total_bonus, total_deductions, total_net, employee_count, status, submitted_by, submitted_at)
  select '2026-04', 'All Departments', sum(base_salary), sum(bonus), sum(deductions), sum(net_pay), count(*), 'processed', 'HR Manager', now() - interval '10 days'
  from payroll_records where month = '2026-04'
  returning id
), run2 as (
  insert into payroll_runs (period, department, total_base, total_bonus, total_deductions, total_net, employee_count, status, submitted_by, submitted_at)
  select '2026-05', 'All Departments', sum(base_salary), sum(bonus), sum(deductions), sum(net_pay), count(*), 'pending_approval', 'HR Manager', now() - interval '1 day'
  from payroll_records where month = '2026-05'
  returning id
)
insert into payroll_approvals (run_id, approver_name, approver_role, status, notes, acted_at)
select id, 'Chenda Sok', 'CFO', 'approved', 'Looks good', now() - interval '9 days' from run1
union all
select id, 'Chenda Sok', 'CFO', 'pending', null, null from run2;

-- =========================================================================
-- Notifications
-- =========================================================================
insert into notifications (title, message, type, source, is_read) values
  ('New leave request', 'A new leave request needs your review', 'info', 'leave', false),
  ('Payroll processed', 'April 2026 payroll has been processed', 'success', 'payroll', true),
  ('Onboarding delayed', 'An onboarding task is overdue', 'warning', 'onboarding', false),
  ('New candidate applied', 'A new candidate applied to Software Engineer', 'info', 'hire', false),
  ('IT ticket resolved', 'Ticket #IT-104 has been resolved', 'success', 'it_management', true),
  ('Expense rejected', 'An expense claim was rejected', 'error', 'finance', false),
  ('Branch status updated', 'Pursat Branch is now pending activation', 'info', 'branches', true),
  ('Benefits enrollment open', 'Open enrollment period has started', 'info', 'benefits', false),
  ('New tool assigned', 'You were granted access to Expense Submission', 'success', 'tools', true),
  ('Employee offboarded', 'An offboarding process has completed', 'info', 'employees', false);

-- =========================================================================
-- Hiring
-- =========================================================================
do $$
declare
  b record;
  jp_id uuid;
  cand_id uuid;
  titles text[] := array['Software Engineer','Sales Executive','HR Coordinator','Customer Support Agent','Accountant','Marketing Specialist'];
  cand_names text[] := array['Sreyla Pich','Vantha Ros','Chanra Kong','Meta Suon','Sina Vann','Bora Ly','Kanha Sar','Lida Thorn','Nara Chhun','Sok Tep'];
  sources text[] := array['LinkedIn','Referral','Job Board','Career Site','Recruiter'];
  stages text[] := array['applied','screening','interview','offer','hired','rejected'];
  interviewer uuid;
  k int;
begin
  select id into interviewer from employees where role = 'HR Manager' limit 1;

  for b in select id, name from branches where status = 'active' order by random() limit 6 loop
    insert into job_postings (title, department, branch_id, description, location, salary_min, salary_max, status, closing_date)
    values (
      titles[1 + floor(random()*array_length(titles,1))::int],
      'General', b.id,
      'We are looking for a talented individual to join our team in ' || b.name || '.',
      b.name, 500, 1500,
      (array['active','active','interviewing','closed'])[1 + floor(random()*4)::int],
      current_date + 30
    ) returning id into jp_id;

    for k in 1..(2 + floor(random()*3)::int) loop
      insert into candidates (job_posting_id, full_name, email, phone, source, stage, rating, applied_at)
      values (
        jp_id,
        cand_names[1 + floor(random()*array_length(cand_names,1))::int],
        'candidate' || floor(random()*99999)::text || '@example.com',
        '+855 ' || (10+floor(random()*80))::text || ' ' || (100+floor(random()*900))::text || ' ' || (100+floor(random()*900))::text,
        sources[1 + floor(random()*array_length(sources,1))::int],
        stages[1 + floor(random()*array_length(stages,1))::int],
        1 + floor(random()*5)::int,
        now() - (floor(random()*30))::int * interval '1 day'
      ) returning id into cand_id;

      if random() > 0.4 then
        insert into interviews (candidate_id, interviewer_id, scheduled_at, duration_minutes, type, status, feedback, score)
        values (
          cand_id, interviewer,
          now() + (floor(random()*10) - 5)::int * interval '1 day',
          45,
          (array['video','in-person','phone'])[1 + floor(random()*3)::int],
          (array['scheduled','completed'])[1 + floor(random()*2)::int],
          'Solid communication skills', 3 + floor(random()*2)::int
        );
      end if;
    end loop;
  end loop;
end $$;

-- =========================================================================
-- Offboarding
-- =========================================================================
do $$
declare
  emp record;
  off_id uuid;
begin
  for emp in select id from employees where status = 'inactive' limit 4 loop
    insert into offboarding_requests (employee_id, last_day, reason, status)
    values (emp.id, current_date - floor(random()*15)::int, 'Resignation', (array['notice_period','exit_interview','clearance','completed'])[1+floor(random()*4)::int])
    returning id into off_id;

    insert into offboarding_tasks (offboarding_id, title, type, assignee, status, due_date) values
      (off_id, 'Revoke system access', 'IT', 'IT Team', 'completed', current_date - 5),
      (off_id, 'Return company equipment', 'IT', 'IT Team', 'pending', current_date + 2),
      (off_id, 'Conduct exit interview', 'HR', 'HR Team', 'pending', current_date + 1),
      (off_id, 'Final payroll settlement', 'Finance', 'Payroll', 'pending', current_date + 5);
  end loop;
end $$;

-- =========================================================================
-- IT assets & tickets
-- =========================================================================
do $$
declare
  emp record;
  asset_types text[] := array['Laptop','Mobile','Display','Peripheral'];
begin
  for emp in select id, branch_id from employees where status = 'active' order by random() limit 40 loop
    insert into it_assets (name, asset_tag, type, employee_id, branch_id, status, serial_number)
    values (
      (array['Dell Latitude 5440','MacBook Pro 14"','Lenovo ThinkPad T14','iPhone 13','Samsung Galaxy S22','Dell 24" Monitor','Logitech MX Keys'])[1+floor(random()*7)::int],
      'AST-' || lpad((1000 + floor(random()*9000))::text, 4, '0'),
      asset_types[1+floor(random()*array_length(asset_types,1))::int],
      emp.id, emp.branch_id, 'active',
      upper(substr(md5(random()::text), 1, 10))
    );
  end loop;

  insert into it_assets (name, asset_tag, type, status, serial_number)
  select 'Spare Laptop ' || g, 'AST-SP' || g, 'Laptop', 'inventory', upper(substr(md5(random()::text),1,10))
  from generate_series(1,5) g;
end $$;

insert into it_tickets (title, requester_name, priority, status, category, description, created_at, resolved_at)
select
  (array['Laptop won''t boot','VPN connection issue','Need software license','Password reset request','Printer not working','Email sync issue','Slow internet speed','New employee equipment setup'])[1+floor(random()*8)::int],
  (array['Sokha Meas','Vibol Chan','Dara Sok','Sopheak Chan','Rithy Heng'])[1+floor(random()*5)::int],
  (array['low','medium','high','critical'])[1+floor(random()*4)::int],
  st.status,
  (array['Hardware','Software','Network','Access','Account'])[1+floor(random()*5)::int],
  'Reported via helpdesk portal',
  now() - (floor(random()*20))::int * interval '1 day',
  case when st.status in ('resolved','closed') then now() - (floor(random()*5))::int * interval '1 day' else null end
from generate_series(1,18) g, lateral (select (array['open','in_progress','resolved','closed'])[1+floor(random()*4)::int] as status) st;

-- =========================================================================
-- Finance / expenses
-- =========================================================================
insert into expense_records (category, branch_id, amount, date, status, description, submitted_by)
select
  (array['Office Rent','IT Equipment','Travel','Training','Marketing','Utilities','Software','Catering','Office Supplies','Legal'])[1+floor(random()*10)::int],
  b.id,
  round((100 + random()*4000)::numeric, 2),
  current_date - (floor(random()*90))::int,
  (array['pending','approved','paid','rejected'])[1+floor(random()*4)::int],
  'Recurring operational expense',
  'Finance Team'
from generate_series(1,35) g
join lateral (select id from branches order by random() limit 1) b on true;

-- =========================================================================
-- Benefits
-- =========================================================================
insert into benefit_plans (name, provider, type, status, eligible_count, description, coverage_amount, employee_contribution) values
  ('Premium Health Plan', 'Forte Insurance', 'health', 'active', 0, 'Comprehensive medical, dental, and vision coverage', 5000, 25),
  ('Standard Health Plan', 'Forte Insurance', 'health', 'active', 0, 'Basic medical coverage', 2500, 10),
  ('Dental Care Plus', 'Smile Assurance', 'dental', 'active', 0, 'Full dental coverage including orthodontics', 1500, 8),
  ('Retirement Savings Plan', 'Cambodia Provident Fund', 'retirement', 'active', 0, 'Employer-matched retirement savings', 0, 5),
  ('Wellness Program', 'FitLife Cambodia', 'wellness', 'active', 0, 'Gym membership and wellness stipend', 300, 0),
  ('Commuter Benefits', 'CityMove', 'commuter', 'active', 0, 'Monthly transportation allowance', 100, 0);

insert into benefit_enrollments (plan_id, employee_id, status)
select p.id, e.id, (array['active','enrolled','opted_out'])[1+floor(random()*3)::int]
from employees e
join lateral (select id from benefit_plans order by random() limit (1 + floor(random()*2)::int)) p on true
where e.status = 'active' and random() > 0.3;

update benefit_plans p set eligible_count = (select count(*) from benefit_enrollments be where be.plan_id = p.id);

-- =========================================================================
-- Announcements
-- =========================================================================
insert into announcements (title, content, category, priority, author_name, author_role, pinned, visible_to, view_count, published_at) values
  ('Khmer New Year Holiday Schedule', 'Office will be closed April 14-16 for Khmer New Year celebrations.', 'event', 'high', 'Sokha Meas', 'CEO', true, 'all', 340, now() - interval '20 days'),
  ('Updated Remote Work Policy', 'Please review the updated hybrid work policy effective next month.', 'policy', 'urgent', 'Vibol Chan', 'COO', true, 'all', 512, now() - interval '15 days'),
  ('Q2 All-Hands Meeting', 'Join us for the quarterly all-hands meeting on the 20th.', 'news', 'normal', 'HR Manager', 'HR Manager', false, 'all', 210, now() - interval '10 days'),
  ('Open Enrollment for Benefits', 'Benefits open enrollment period begins next week.', 'benefits', 'high', 'HR Manager', 'HR Manager', false, 'all', 180, now() - interval '8 days'),
  ('Data Security Training Required', 'All staff must complete the annual security compliance training.', 'compliance', 'urgent', 'Rithy Heng', 'CTO', true, 'all', 290, now() - interval '5 days'),
  ('Welcome New Hires', 'Please welcome our newest team members across all branches.', 'hr', 'normal', 'HR Manager', 'HR Manager', false, 'all', 95, now() - interval '3 days'),
  ('Branch Manager Meeting Notes', 'Notes from the monthly branch managers sync are now available.', 'general', 'normal', 'Vibol Chan', 'COO', false, 'management', 60, now() - interval '2 days'),
  ('New Payroll Cycle Dates', 'Payroll processing dates have shifted to the 28th of each month.', 'policy', 'high', 'Chenda Sok', 'CFO', false, 'all', 145, now() - interval '1 days');

-- =========================================================================
-- Attendance (last 7 days for active employees)
-- =========================================================================
insert into attendance_records (employee_id, date, clock_in, clock_out, status, late_minutes, hours_worked)
select
  e.id,
  d::date,
  case when st = 'absent' then null else ('08:' || lpad(floor(random()*30)::text,2,'0') || ':00')::time end,
  case when st = 'absent' then null else ('17:' || lpad(floor(random()*30)::text,2,'0') || ':00')::time end,
  st,
  case when st = 'late' then 10 + floor(random()*30)::int else 0 end,
  case when st = 'absent' then null else round((7.5 + random())::numeric, 2) end
from employees e
cross join generate_series(current_date - 6, current_date, interval '1 day') d
join lateral (select (array['present','present','present','present','late','remote','absent'])[1+floor(random()*7)::int] as st) s on true
where e.status = 'active' and extract(dow from d) not in (0,6);

-- =========================================================================
-- Disciplinary records
-- =========================================================================
insert into disciplinary_records (employee_id, type, title, description, severity, status, incident_date, created_by)
select
  e.id,
  (array['verbal_warning','written_warning','final_warning','incident'])[1+floor(random()*4)::int],
  (array['Repeated tardiness','Policy violation','Unprofessional conduct','Missed deadline'])[1+floor(random()*4)::int],
  'Documented per HR policy after review.',
  (array['low','medium','high'])[1+floor(random()*3)::int],
  (array['open','in_progress','resolved','closed'])[1+floor(random()*4)::int],
  current_date - floor(random()*60)::int,
  'HR Manager'
from employees e order by random() limit 8;

-- =========================================================================
-- Documents
-- =========================================================================
insert into documents (title, category, description, file_name, file_size_kb, file_type, version, status, visibility, author_name, tags, download_count, is_template) values
  ('Employee Handbook 2026', 'policy', 'Company-wide policies and code of conduct', 'employee-handbook-2026.pdf', 2450, 'pdf', '3.1', 'active', 'all', 'HR Manager', array['handbook','policy'], 412, false),
  ('Standard Employment Contract', 'contract', 'Template for new hire contracts', 'employment-contract-template.docx', 85, 'docx', '2.0', 'active', 'hr_only', 'Legal Counsel', array['contract','template'], 88, true),
  ('Leave Request Form', 'template', 'Standard leave request template', 'leave-request-form.pdf', 45, 'pdf', '1.2', 'active', 'all', 'HR Manager', array['leave','template'], 260, true),
  ('Data Protection Compliance Guide', 'compliance', 'Guidelines for handling employee data', 'data-protection-guide.pdf', 610, 'pdf', '1.0', 'active', 'managers', 'Compliance Officer', array['compliance','privacy'], 74, false),
  ('Benefits Summary Booklet', 'benefits', 'Overview of all benefit plans', 'benefits-summary.pdf', 320, 'pdf', '2.3', 'active', 'all', 'HR Manager', array['benefits'], 198, false),
  ('New Hire Training Roadmap', 'training', 'Structured 30-60-90 day onboarding plan', 'training-roadmap.pptx', 540, 'pptx', '1.0', 'active', 'all', 'Training Team', array['training','onboarding'], 130, true),
  ('Org Chart Q2 2026', 'org', 'Current organizational structure', 'org-chart-q2-2026.png', 210, 'png', '1.0', 'active', 'all', 'HR Manager', array['orgchart'], 96, false),
  ('Expense Reimbursement Policy', 'policy', 'Rules and limits for expense claims', 'expense-policy.pdf', 150, 'pdf', '1.4', 'active', 'all', 'Finance Manager', array['finance','policy'], 220, false);

-- =========================================================================
-- Performance
-- =========================================================================
do $$
declare
  emp record;
  reviewer_id uuid;
begin
  select id into reviewer_id from employees where role = 'HR Manager' limit 1;
  for emp in select id from employees where status = 'active' order by random() limit 30 loop
    insert into performance_reviews (employee_id, reviewer_id, quarter, year, overall_score, communication_score, teamwork_score, technical_score, leadership_score, status, submitted_at)
    values (
      emp.id, reviewer_id,
      (array['Q1','Q2'])[1+floor(random()*2)::int], 2026,
      round((3 + random()*2)::numeric,2), round((3+random()*2)::numeric,2), round((3+random()*2)::numeric,2), round((3+random()*2)::numeric,2), round((3+random()*2)::numeric,2),
      'submitted', now() - (floor(random()*40))::int * interval '1 day'
    );
    insert into performance_goals (employee_id, title, description, target_date, progress, status)
    values (
      emp.id,
      (array['Improve client response time','Complete certification course','Lead a cross-team project','Reduce processing errors'])[1+floor(random()*4)::int],
      'Quarterly individual development goal.',
      current_date + (30 + floor(random()*60))::int,
      floor(random()*100)::int,
      (array['active','completed'])[1+floor(random()*2)::int]
    );
  end loop;
end $$;

-- =========================================================================
-- Training
-- =========================================================================
insert into training_courses (title, description, category, duration_hours, instructor, format, status) values
  ('Workplace Safety Fundamentals', 'Core safety practices for all staff', 'Compliance', 2, 'External Trainer', 'online', 'active'),
  ('Leadership Essentials', 'Foundational leadership skills for new managers', 'Leadership', 8, 'Vibol Chan', 'in_person', 'active'),
  ('Data Privacy & Security', 'Annual mandatory security awareness training', 'Compliance', 1.5, 'IT Manager', 'online', 'active'),
  ('Customer Service Excellence', 'Best practices for customer-facing roles', 'General', 4, 'External Trainer', 'hybrid', 'active'),
  ('Advanced Excel for Finance', 'Financial modeling and reporting techniques', 'Finance', 6, 'Chenda Sok', 'self_paced', 'active'),
  ('Effective Communication', 'Communication skills for cross-functional teams', 'General', 3, 'HR Manager', 'online', 'active');

insert into training_enrollments (course_id, employee_id, status, progress, enrolled_at, certificate_issued)
select
  c.id, e.id,
  st.status,
  case when st.status = 'completed' then 100 when st.status = 'dropped' then floor(random()*40)::int else floor(random()*90)::int end,
  now() - (floor(random()*60))::int * interval '1 day',
  st.status = 'completed'
from employees e
join lateral (select id from training_courses order by random() limit (1+floor(random()*2)::int)) c on true
join lateral (select (array['enrolled','in_progress','completed','completed','dropped'])[1+floor(random()*5)::int] as status) st on true
where e.status = 'active' and random() > 0.35;

-- =========================================================================
-- Shifts
-- =========================================================================
do $$
declare
  b record;
  shift_id uuid;
  d date;
begin
  for b in select id, name from branches where status = 'active' loop
    for d in select generate_series(current_date, current_date + 6, interval '1 day')::date loop
      insert into shifts (name, branch_id, department, start_time, end_time, shift_date, capacity, color)
      values ('Day Shift', b.id, 'Operations', '08:00', '17:00', d, 4, '#0D7377')
      returning id into shift_id;

      insert into shift_assignments (shift_id, employee_id, status)
      select shift_id, id, 'scheduled' from employees where branch_id = b.id and status = 'active' order by random() limit 2;
    end loop;
  end loop;
end $$;

-- =========================================================================
-- Tools (internal HR utilities)
-- =========================================================================
insert into tools (name, description, icon, category, status) values
  ('Time Tracker', 'Track daily working hours and attendance', 'ri-time-line', 'Productivity', 'active'),
  ('Document Generator', 'Generate contracts and HR letters automatically', 'ri-file-text-line', 'Documents', 'active'),
  ('Performance Review Builder', 'Create and manage performance review cycles', 'ri-star-line', 'Reviews', 'active'),
  ('Expense Submission', 'Submit and track reimbursement claims', 'ri-wallet-3-line', 'Finance', 'active'),
  ('Shift Scheduler', 'Plan and assign employee shifts', 'ri-calendar-schedule-line', 'Scheduling', 'active'),
  ('Compliance Auditor', 'Run internal compliance checklists', 'ri-shield-check-line', 'Compliance', 'active'),
  ('Feedback Survey Tool', 'Send and collect employee feedback surveys', 'ri-survey-line', 'Feedback', 'active'),
  ('Employee Referral Portal', 'Submit and track employee referrals', 'ri-user-add-line', 'Hiring', 'active');

insert into tool_assignments (tool_id, employee_id, assigned_at)
select t.id, e.id, now() - (floor(random()*60))::int * interval '1 day'
from employees e
join lateral (select id from tools order by random() limit (1+floor(random()*3)::int)) t on true
where e.status = 'active' and random() > 0.3;

insert into tool_usages (tool_id, employee_id, action, created_at)
select ta.tool_id, ta.employee_id,
  (select action from (values
    (1,'track_hours'),(2,'generate_doc'),(3,'create_review'),(4,'submit_expense'),
    (5,'create_schedule'),(6,'run_audit'),(7,'create_survey'),(8,'submit_referral')
  ) as m(tool_id, action) where m.tool_id = ta.tool_id),
  now() - (floor(random()*30))::int * interval '1 day'
from tool_assignments ta, generate_series(1, 2);

-- =========================================================================
-- Unity Apps (external SaaS integrations)
-- =========================================================================
insert into unity_apps (name, description, category, icon, color, status, version, vendor, monthly_cost) values
  ('Slack', 'Team messaging and collaboration', 'Communication', 'ri-slack-line', '#4A154B', 'active', '4.35', 'Salesforce', 8),
  ('GitHub', 'Source control and code collaboration', 'Engineering', 'ri-github-line', '#181717', 'active', 'Enterprise', 'Microsoft', 21),
  ('Figma', 'Collaborative design and prototyping', 'Design', 'ri-pencil-ruler-2-line', '#F24E1E', 'active', '116.0', 'Figma Inc.', 15),
  ('Notion', 'Docs, wikis, and project tracking', 'Productivity', 'ri-file-list-3-line', '#000000', 'active', '2.0', 'Notion Labs', 10),
  ('Salesforce', 'CRM and sales pipeline management', 'Sales', 'ri-line-chart-line', '#00A1E0', 'active', 'Summer 26', 'Salesforce', 150);

insert into unity_apps (name, description, category, icon, color, status, version, vendor, monthly_cost) values
  ('BambooHR', 'HR records and org management', 'HR', 'ri-team-line', '#98CD00', 'active', '3.4', 'BambooHR', 12),
  ('Okta', 'Identity and access management', 'Security', 'ri-shield-keyhole-line', '#007DC1', 'active', '2024.1', 'Okta Inc.', 9),
  ('Jira', 'Issue tracking and sprint planning', 'Engineering', 'ri-git-branch-line', '#0052CC', 'maintenance', '9.12', 'Atlassian', 14);

insert into app_access (app_id, employee_id, access_level, granted_at, granted_by, is_active)
select a.id, e.id, (array['viewer','user','user','admin'])[1+floor(random()*4)::int], now() - (floor(random()*90))::int * interval '1 day', 'IT Manager', true
from employees e
join lateral (select id from unity_apps order by random() limit (1+floor(random()*3)::int)) a on true
where e.status = 'active' and random() > 0.25;

insert into app_usage_logs (app_id, employee_id, action, duration_minutes, logged_at)
select aa.app_id, aa.employee_id,
  (array['message_sent','file_shared','pull_request','code_review','comment_added','meeting_hosted','issue_updated','ticket_created'])[1+floor(random()*8)::int],
  5 + floor(random()*55)::int,
  now() - (floor(random()*20))::int * interval '1 day'
from app_access aa, generate_series(1,3);

-- =========================================================================
-- Audit log
-- =========================================================================
insert into audit_logs (module, action, entity_type, actor_name, actor_role, description, created_at)
select
  m.module, m.action, m.entity_type, actors.name, actors.role,
  m.description,
  now() - (floor(random()*30))::int * interval '1 day'
from (values
  ('hire','created','job_posting','New job posting created for Software Engineer'),
  ('leave','approved','leave_request','Leave request approved'),
  ('payroll','processed','payroll_run','April 2026 payroll processed'),
  ('onboarding','created','onboarding_request','New onboarding request started'),
  ('employees','updated','employee','Employee profile updated'),
  ('offboard','created','offboarding_request','Offboarding process initiated'),
  ('it','updated','it_ticket','IT ticket status changed'),
  ('finance','approved','expense_record','Expense claim approved'),
  ('benefits','created','benefit_enrollment','New benefit enrollment submitted'),
  ('tools','updated','tool_assignment','Tool access granted'),
  ('unity','created','app_access','App access granted'),
  ('branches','updated','branch','Branch details updated'),
  ('settings','updated','system_settings','System setting changed'),
  ('hire','approved','candidate','Candidate moved to offer stage'),
  ('leave','rejected','leave_request','Leave request rejected'),
  ('payroll','approved','payroll_run','Payroll run approved by finance'),
  ('onboarding','processed','onboarding_checklist_tasks','Onboarding checklist task completed'),
  ('employees','created','employee','New employee record created'),
  ('offboard','processed','offboarding_tasks','Offboarding task completed'),
  ('it','created','it_asset','New IT asset registered'),
  ('finance','created','expense_record','New expense submitted'),
  ('benefits','updated','benefit_plan','Benefit plan details updated'),
  ('tools','created','tool_usage','Tool usage logged'),
  ('unity','updated','app_usage_logs','App usage recorded'),
  ('branches','created','branch','New branch registered')
) as m(module, action, entity_type, description)
join lateral (
  select name, role from (values
    ('HR Manager','HR Manager'), ('Sokha Meas','CEO'), ('Vibol Chan','COO'), ('Chenda Sok','CFO'), ('Rithy Heng','CTO')
  ) as a(name, role) order by random() limit 1
) actors on true;

-- =========================================================================
-- System settings
-- =========================================================================
insert into system_settings (key, value, type) values
  ('company_name', 'HR Nexus Cambodia', 'text'),
  ('default_currency', 'USD', 'text'),
  ('timezone', 'Asia/Phnom_Penh', 'text'),
  ('fiscal_year_start', 'January', 'text'),
  ('week_start_day', 'Monday', 'text'),
  ('default_work_hours', '8', 'number'),
  ('overtime_threshold', '40', 'number'),
  ('leave_approval_required', 'true', 'boolean'),
  ('auto_payroll_reminder', 'true', 'boolean'),
  ('notification_email_new_leave', 'true', 'boolean'),
  ('notification_push_new_leave', 'true', 'boolean'),
  ('notification_email_payroll', 'true', 'boolean'),
  ('notification_push_payroll', 'false', 'boolean'),
  ('notification_email_onboarding', 'true', 'boolean'),
  ('notification_push_onboarding', 'true', 'boolean'),
  ('notification_email_security', 'true', 'boolean'),
  ('notification_push_security', 'true', 'boolean'),
  ('notification_email_weekly', 'false', 'boolean'),
  ('notification_push_weekly', 'false', 'boolean');
