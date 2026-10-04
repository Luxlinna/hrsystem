-- Offer Letter Module Migration
-- Handles the complete offer lifecycle:
-- Selected -> Salary Proposal -> Salary Approval -> Generate Offer Letter -> HR Review -> Approval -> Issue Offer -> Candidate Accept / Reject

create table if not exists public.offer_letters (
  id uuid primary key default gen_random_uuid(),
  offer_number text not null unique,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  candidate_name text not null,
  candidate_email text,
  candidate_phone text,
  candidate_address text,
  hiring_request_id uuid references public.hiring_requests(id) on delete set null,
  job_posting_id uuid references public.job_postings(id) on delete set null,
  job_title text not null,
  department text not null,
  division text,
  business_unit text,
  branch_id uuid references public.branches(id) on delete set null,
  reporting_to text,
  employment_type text not null default 'Full-time',
  working_days text default 'Monday to Saturday Half',
  working_time text default '8:00 am – 5:00 pm',
  base_salary numeric not null default 0,
  probation_salary numeric,
  probation_months integer not null default 3,
  target_start_date date not null,
  allowances jsonb default '[]'::jsonb,
  benefits_summary text,
  special_terms text,
  status text not null default 'salary_proposal' check (
    status in (
      'salary_proposal',
      'salary_approved',
      'draft_letter',
      'hr_review',
      'management_approval',
      'approved',
      'issued',
      'accepted',
      'rejected'
    )
  ),

  -- Audit & Approval timestamps & actors
  proposed_by_id uuid,
  proposed_by_name text,
  proposed_at timestamptz default now(),
  proposal_notes text,

  salary_approved_by text,
  salary_approved_at timestamptz,
  salary_approval_notes text,

  hr_reviewed_by text,
  hr_reviewed_at timestamptz,
  hr_review_notes text,

  management_approved_by text,
  management_approved_at timestamptz,
  management_approval_notes text,

  issued_by text,
  issued_at timestamptz,
  expiry_date date,

  decision_at timestamptz,
  decision_notes text,
  rejection_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by text
);

-- Indices for performance
create index if not exists idx_offer_letters_candidate_id on public.offer_letters(candidate_id);
create index if not exists idx_offer_letters_status on public.offer_letters(status);
create index if not exists idx_offer_letters_hiring_request on public.offer_letters(hiring_request_id);
create index if not exists idx_offer_letters_deleted_at on public.offer_letters(deleted_at);

-- Enable RLS
alter table public.offer_letters enable row level security;

drop policy if exists "Allow all authenticated users to view offer letters" on public.offer_letters;
create policy "Allow all authenticated users to view offer letters"
  on public.offer_letters for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated users to insert offer letters" on public.offer_letters;
create policy "Allow authenticated users to insert offer letters"
  on public.offer_letters for insert
  to authenticated
  with check (true);

drop policy if exists "Allow authenticated users to update offer letters" on public.offer_letters;
create policy "Allow authenticated users to update offer letters"
  on public.offer_letters for update
  to authenticated
  using (true);

drop policy if exists "Allow authenticated users to delete offer letters" on public.offer_letters;
create policy "Allow authenticated users to delete offer letters"
  on public.offer_letters for delete
  to authenticated
  using (true);
