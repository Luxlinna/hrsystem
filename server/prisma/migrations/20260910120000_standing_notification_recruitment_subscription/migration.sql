-- Standing Notification Subscription: Add assigned_recruiter fields & stage tracking
alter table if exists hiring_requests
  add column if not exists assigned_recruiter_id uuid references employees(id) on delete set null,
  add column if not exists assigned_recruiter_name text,
  add column if not exists stage_entered_at timestamptz default now();

-- Backfill assigned_recruiter from hr_assigned_to if present
update hiring_requests
set assigned_recruiter_id = coalesce(assigned_recruiter_id, hr_assigned_to_id),
    assigned_recruiter_name = coalesce(assigned_recruiter_name, hr_assigned_to_name)
where assigned_recruiter_id is null and hr_assigned_to_id is not null;

-- Synchronize hr_assigned_to from assigned_recruiter if hr_assigned_to is null
update hiring_requests
set hr_assigned_to_id = coalesce(hr_assigned_to_id, assigned_recruiter_id),
    hr_assigned_to_name = coalesce(hr_assigned_to_name, assigned_recruiter_name)
where hr_assigned_to_id is null and assigned_recruiter_id is not null;

-- Index for quick recruiter queries & stage SLA tracking
create index if not exists idx_hiring_requests_assigned_recruiter on hiring_requests(assigned_recruiter_id);
create index if not exists idx_hiring_requests_stage_entered_at on hiring_requests(stage_entered_at);
