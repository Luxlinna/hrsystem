-- Add hiring_requests table for branch employee requisitions
create table if not exists hiring_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  branch_id uuid references branches(id) on delete set null,
  requested_by_id uuid references employees(id) on delete set null,
  requested_by_name text not null,
  requested_by_email text,
  headcount int not null default 1,
  employment_type text not null default 'full-time' check (employment_type in ('full-time','part-time','contract','internship')),
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  justification text,
  urgency text not null default 'medium' check (urgency in ('low','medium','high','urgent')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','fulfilled')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  job_posting_id uuid references job_postings(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text
);

create index if not exists idx_hiring_requests_branch_id on hiring_requests(branch_id);
create index if not exists idx_hiring_requests_status on hiring_requests(status);

-- Enable RLS
alter table hiring_requests enable row level security;

-- Policies
create policy "Allow read hiring_requests for authenticated users"
  on hiring_requests for select
  to authenticated
  using (true);

create policy "Allow insert hiring_requests for authenticated users"
  on hiring_requests for insert
  to authenticated
  with check (true);

create policy "Allow update hiring_requests for authenticated users"
  on hiring_requests for update
  to authenticated
  using (true);

-- Enable realtime
alter publication supabase_realtime add table hiring_requests;
