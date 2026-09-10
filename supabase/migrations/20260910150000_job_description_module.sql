-- Native Job Description Module Migration
-- 1. Create job_description_templates table for reusable enterprise JD library
create table if not exists job_description_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  business_unit text,
  branch_id uuid references branches(id) on delete set null,
  job_summary text not null,
  responsibilities text not null,
  requirements text not null,
  qualifications text not null,
  reporting_line text,
  version int not null default 1,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and public policies for authenticated users
alter table job_description_templates enable row level security;

drop policy if exists "Allow all authenticated users to read JD templates" on job_description_templates;
create policy "Allow all authenticated users to read JD templates"
  on job_description_templates for select
  to authenticated
  using (true);
  

drop policy if exists "Allow all authenticated users to insert JD templates" on job_description_templates;
create policy "Allow all authenticated users to insert JD templates"
  on job_description_templates for insert
  to authenticated
  with check (true);

drop policy if exists "Allow all authenticated users to update JD templates" on job_description_templates;
create policy "Allow all authenticated users to update JD templates"
  on job_description_templates for update
  to authenticated
  using (true);

-- 2. Add native structured JD fields to hiring_requests
alter table hiring_requests
  add column if not exists jd_summary text,
  add column if not exists jd_responsibilities text,
  add column if not exists jd_requirements text,
  add column if not exists jd_qualifications text,
  add column if not exists jd_reporting_line text,
  add column if not exists jd_template_id uuid references job_description_templates(id) on delete set null,
  add column if not exists jd_version int default 1;

-- 3. Unique index to support reusable templates per title and department
create unique index if not exists idx_job_description_templates_title_dept
  on job_description_templates (title, department);

