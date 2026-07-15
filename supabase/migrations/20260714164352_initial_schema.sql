-- HR Management System — initial schema
-- Reconstructed from frontend Supabase queries (src/pages/**, src/hooks/**, src/components/**)

create extension if not exists pgcrypto;

-- =========================================================================
-- branches
-- =========================================================================
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  manager_name text,
  employee_count int not null default 0,
  status text not null default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- employees
-- =========================================================================
create table employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  role text,
  department text,
  branch_id uuid references branches(id) on delete set null,
  status text not null default 'active' check (status in ('active','on_leave','inactive','suspended','onboarding')),
  join_date date not null default current_date,
  avatar_url text,
  reports_to uuid references employees(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table branches add column manager_id uuid references employees(id) on delete set null;

-- =========================================================================
-- onboarding
-- =========================================================================
create table onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  stage text not null default 'document' check (stage in ('document','it_setup','training','complete')),
  day_count int not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','completed')),
  requested_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  onboarding_request_id uuid not null references onboarding_requests(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  document_name text not null,
  document_type text,
  stage text check (stage in ('document','it_setup','training','complete')),
  status text not null default 'pending' check (status in ('pending','complete')),
  file_url text,
  file_name text,
  notes text,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table onboarding_checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  onboarding_request_id uuid not null references onboarding_requests(id) on delete cascade,
  task_name text not null,
  description text,
  category text check (category in ('documents','it_setup','training','general')),
  assigned_to text,
  assigned_to_role text,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by text,
  priority text check (priority in ('high','medium','low')),
  sort_order int not null default 0
);

-- =========================================================================
-- leave
-- =========================================================================
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type text not null check (leave_type in ('annual','vacation','sick','personal','maternity','paternity','bereavement','unpaid','study')),
  start_date date not null,
  end_date date not null,
  days int not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- payroll
-- =========================================================================
create table payroll_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month text not null,
  base_salary numeric(12,2) not null default 0,
  bonus numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  gross_pay numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','processed','paid')),
  created_at timestamptz not null default now()
);

create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  department text,
  total_base numeric(14,2) not null default 0,
  total_bonus numeric(14,2) not null default 0,
  total_deductions numeric(14,2) not null default 0,
  total_net numeric(14,2) not null default 0,
  employee_count int not null default 0,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','processed')),
  submitted_by text,
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table payroll_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  approver_name text not null,
  approver_role text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- notifications / fcm
-- =========================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info','warning','success','error')),
  source text check (source in ('hire','leave','payroll','branches','system','employees','onboarding','offboard','finance','it_management','benefits','tools')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  token text not null,
  device_type text default 'web',
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- =========================================================================
-- RBAC (app_roles / user_role_assignments) — keyed to Supabase auth.users
-- =========================================================================
create table app_roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  color text,
  is_admin boolean not null default false,
  allowed_modules text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_role_assignments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role_id bigint references app_roles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- =========================================================================
-- hire / recruitment
-- =========================================================================
create table job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  branch_id uuid references branches(id) on delete set null,
  description text,
  requirements text[] not null default array[]::text[],
  location text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  type text default 'full-time' check (type in ('full-time','part-time','contract','internship')),
  status text not null default 'active' check (status in ('active','interviewing','closed')),
  posted_at timestamptz not null default now(),
  closing_date date
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid references job_postings(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  source text,
  stage text not null default 'applied' check (stage in ('applied','screening','interview','offer','hired','rejected')),
  rating int check (rating between 1 and 5),
  notes text,
  applied_at timestamptz not null default now(),
  resume_url text,
  resume_name text,
  linkedin_url text
);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  interviewer_id uuid references employees(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes int default 30,
  type text default 'video' check (type in ('video','in-person','phone')),
  status text not null default 'scheduled' check (status in ('scheduled','completed')),
  feedback text,
  score numeric(3,2),
  notes text
);

-- =========================================================================
-- offboarding
-- =========================================================================
create table offboarding_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  last_day date,
  reason text,
  status text not null default 'notice_period' check (status in ('notice_period','exit_interview','clearance','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table offboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  offboarding_id uuid not null references offboarding_requests(id) on delete cascade,
  title text not null,
  type text,
  assignee text,
  status text not null default 'pending' check (status in ('pending','completed')),
  due_date date,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- IT
-- =========================================================================
create table it_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_tag text,
  type text check (type in ('Laptop','Mobile','Phone','Display','Peripheral','Furniture','Server','Network','Power','Other')),
  employee_id uuid references employees(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  status text not null default 'inventory' check (status in ('active','inventory','maintenance','retired')),
  serial_number text,
  created_at timestamptz not null default now()
);

create table it_tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requester_name text,
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  category text check (category in ('Hardware','Software','Network','Access','Account','Other')),
  description text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- =========================================================================
-- finance
-- =========================================================================
create table expense_records (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  branch_id uuid references branches(id) on delete set null,
  amount numeric(12,2) not null,
  date date not null default current_date,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  description text,
  submitted_by text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- benefits
-- =========================================================================
create table benefit_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  type text check (type in ('health','dental','retirement','wellness','commuter','parental')),
  status text not null default 'active' check (status in ('active','inactive')),
  eligible_count int default 0,
  description text,
  coverage_amount numeric(12,2),
  employee_contribution numeric(12,2),
  created_at timestamptz not null default now()
);

create table benefit_enrollments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references benefit_plans(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('active','enrolled','opted_out')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- announcements
-- =========================================================================
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  category text check (category in ('event','policy','news','benefits','compliance','hr','general')),
  priority text default 'normal' check (priority in ('urgent','high','normal')),
  author_name text,
  author_role text,
  pinned boolean not null default false,
  visible_to text default 'all' check (visible_to in ('all','hq','management')),
  published_at timestamptz not null default now(),
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- attendance
-- =========================================================================
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null default current_date,
  clock_in time,
  clock_out time,
  status text not null default 'present' check (status in ('present','absent','late','half_day','remote','wfh','holiday')),
  late_minutes int default 0,
  hours_worked numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- audit log
-- =========================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('hire','leave','payroll','onboarding','employees','offboard','it','finance','benefits','tools','unity','branches','settings')),
  action text not null check (action in ('created','updated','approved','rejected','deleted','processed')),
  entity_type text,
  entity_id uuid,
  actor_name text,
  actor_role text,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- disciplinary
-- =========================================================================
create table disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text check (type in ('verbal_warning','written_warning','final_warning','pip','incident','suspension','termination')),
  title text not null,
  description text,
  severity text check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','escalated','closed')),
  incident_date date,
  follow_up_date date,
  resolved_at timestamptz,
  created_by text,
  witnesses text,
  action_taken text,
  pip_start_date date,
  pip_end_date date,
  pip_goals text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- documents
-- =========================================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('policy','contract','template','compliance','benefits','training','org')),
  subcategory text,
  description text,
  file_name text,
  file_size_kb int,
  file_type text check (file_type in ('pdf','docx','xlsx','pptx','jpg','png')),
  version text default '1.0',
  status text not null default 'active' check (status in ('active','archived')),
  visibility text default 'all' check (visibility in ('all','hr_only','managers')),
  author_name text,
  tags text[] default array[]::text[],
  download_count int not null default 0,
  is_template boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- performance
-- =========================================================================
create table performance_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  reviewer_id uuid references employees(id) on delete set null,
  quarter text check (quarter in ('Q1','Q2','Q3','Q4')),
  year int not null,
  overall_score numeric(3,2),
  communication_score numeric(3,2),
  teamwork_score numeric(3,2),
  technical_score numeric(3,2),
  leadership_score numeric(3,2),
  comments text,
  strengths text,
  areas_for_improvement text,
  status text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table performance_goals (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active','completed'))
);

-- =========================================================================
-- training
-- =========================================================================
create table training_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  duration_hours numeric(5,2),
  instructor text,
  format text check (format in ('online','in_person','hybrid','self_paced')),
  status text not null default 'active' check (status in ('active','draft','archived')),
  created_at timestamptz not null default now()
);

create table training_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references training_courses(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled','in_progress','completed','failed','dropped')),
  progress int not null default 0 check (progress between 0 and 100),
  score numeric(5,2),
  enrolled_at timestamptz not null default now(),
  due_date date,
  completed_at timestamptz,
  certificate_issued boolean not null default false,
  notes text
);

-- =========================================================================
-- shifts
-- =========================================================================
create table shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branch_id uuid references branches(id) on delete set null,
  department text,
  start_time time not null,
  end_time time not null,
  shift_date date not null,
  capacity int default 1,
  color text,
  notes text
);

create table shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled'))
);

-- =========================================================================
-- tools
-- =========================================================================
create table tools (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  icon text,
  category text check (category in ('Productivity','Documents','Reviews','Finance','Scheduling','Compliance','Feedback','Hiring')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table tool_assignments (
  id bigint generated always as identity primary key,
  tool_id bigint not null references tools(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table tool_usages (
  id bigint generated always as identity primary key,
  tool_id bigint not null references tools(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  action text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- unity apps
-- =========================================================================
create table unity_apps (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  category text check (category in ('Communication','Engineering','Design','Productivity','Sales','HR','Security')),
  icon text,
  color text,
  integration_url text,
  docs_url text,
  status text not null default 'active' check (status in ('active','maintenance')),
  version text,
  vendor text,
  monthly_cost numeric(10,2),
  created_at timestamptz not null default now()
);

create table app_access (
  id bigint generated always as identity primary key,
  app_id bigint not null references unity_apps(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  access_level text default 'user' check (access_level in ('viewer','user','admin')),
  granted_at timestamptz not null default now(),
  granted_by text,
  is_active boolean not null default true
);

create table app_usage_logs (
  id bigint generated always as identity primary key,
  app_id bigint not null references unity_apps(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  action text,
  duration_minutes int,
  logged_at timestamptz not null default now()
);

-- =========================================================================
-- settings
-- =========================================================================
create table system_settings (
  id bigint generated always as identity primary key,
  key text not null unique,
  value text,
  type text,
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- indexes on common FK / filter columns
-- =========================================================================
create index on employees (branch_id);
create index on employees (reports_to);
create index on employees (status);
create index on onboarding_requests (employee_id);
create index on onboarding_documents (onboarding_request_id);
create index on onboarding_checklist_tasks (onboarding_request_id);
create index on leave_requests (employee_id);
create index on payroll_records (employee_id, month);
create index on payroll_approvals (run_id);
create index on job_postings (branch_id);
create index on candidates (job_posting_id);
create index on interviews (candidate_id);
create index on offboarding_tasks (offboarding_id);
create index on it_assets (employee_id);
create index on it_assets (branch_id);
create index on expense_records (branch_id);
create index on benefit_enrollments (plan_id);
create index on benefit_enrollments (employee_id);
create index on attendance_records (employee_id, date);
create index on audit_logs (module, created_at);
create index on disciplinary_records (employee_id);
create index on performance_reviews (employee_id);
create index on performance_goals (employee_id);
create index on training_enrollments (course_id);
create index on training_enrollments (employee_id);
create index on shift_assignments (shift_id);
create index on shift_assignments (employee_id);
create index on tool_assignments (tool_id);
create index on tool_usages (tool_id);
create index on app_access (app_id);
create index on app_usage_logs (app_id);
create index on user_role_assignments (role_id);

-- =========================================================================
-- RLS — internal admin tool: any authenticated user has full access
-- =========================================================================
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'branches','employees','onboarding_requests','onboarding_documents','onboarding_checklist_tasks',
      'leave_requests','payroll_records','payroll_runs','payroll_approvals','notifications','fcm_tokens',
      'app_roles','user_role_assignments','job_postings','candidates','interviews',
      'offboarding_requests','offboarding_tasks','it_assets','it_tickets','expense_records',
      'benefit_plans','benefit_enrollments','announcements','attendance_records','audit_logs',
      'disciplinary_records','documents','performance_reviews','performance_goals',
      'training_courses','training_enrollments','shifts','shift_assignments',
      'tools','tool_assignments','tool_usages','unity_apps','app_access','app_usage_logs','system_settings'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
