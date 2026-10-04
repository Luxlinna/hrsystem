-- Create job_statuses table for BU structure configuration
create table if not exists job_statuses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Enable RLS
alter table job_statuses enable row level security;

-- Policies
create policy "Users can view job_statuses"
  on job_statuses for select
  using (true);

create policy "Admins can manage job_statuses"
  on job_statuses for all
  using (
    exists (
      select 1 from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      and (ar.is_admin = true or ar.name in ('Super Admin', 'Admin', 'HR Manager'))
    )
  );
