-- =========================================================================
-- Complaints & Suggestions Management
-- Tracks workplace complaints, suggestions, and grievances by BU
-- =========================================================================

create table if not exists complaints_suggestions (
  id                  uuid primary key default gen_random_uuid(),
  branch_id           uuid references branches(id) on delete cascade,
  employee_id         uuid references employees(id) on delete set null,
  type                text not null check (type in ('complaint', 'suggestion', 'grievance')),
  entry_date          date not null default current_date,
  target_to           text not null,
  subject             text not null,
  details             text not null,
  suggestion          text,
  remark              text,
  status              text not null default 'pending' check (status in ('pending', 'in_review', 'resolved', 'dismissed')),
  attachment_url      text,
  attachment_name     text,
  recorded_by         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_complaints_suggestions_branch_id   on complaints_suggestions(branch_id);
create index if not exists idx_complaints_suggestions_employee_id on complaints_suggestions(employee_id);
create index if not exists idx_complaints_suggestions_type        on complaints_suggestions(type);
create index if not exists idx_complaints_suggestions_status      on complaints_suggestions(status);
create index if not exists idx_complaints_suggestions_entry_date  on complaints_suggestions(entry_date desc);

-- Enable RLS
alter table complaints_suggestions enable row level security;

create policy "Authenticated users can read complaints_suggestions"
  on complaints_suggestions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert complaints_suggestions"
  on complaints_suggestions for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update complaints_suggestions"
  on complaints_suggestions for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete complaints_suggestions"
  on complaints_suggestions for delete
  using (auth.role() = 'authenticated');
