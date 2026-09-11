-- Migration: Candidate Approval Form (CAF) Workflow
-- Follows the Selected -> Candidate Approval -> Salary Negotiation recruitment progression

create table if not exists public.candidate_approvals (
  id text primary key,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  form_number text not null,
  branch_id uuid references public.branches(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected')),

  -- Section I: Candidate & Role Overview
  candidate_name text not null,
  gender text default 'Female',
  position_applied text not null,
  business_unit text,
  department text,
  hiring_manager text,
  current_salary text,
  expectation_salary text,
  current_benefit text,
  notice_period text,

  -- Section II: Candidate Evaluation Summary
  education_and_skill text,
  work_experience text,
  strengths text,
  improvement text,
  overall_assessment text,
  interview_panels jsonb default '[]'::jsonb,

  -- Section III: 4 Signatories
  signatories jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  deleted_by text
);

-- Indices
create index if not exists idx_candidate_approvals_candidate on public.candidate_approvals(candidate_id);
create index if not exists idx_candidate_approvals_status on public.candidate_approvals(status);
create index if not exists idx_candidate_approvals_deleted_at on public.candidate_approvals(deleted_at);

-- RLS
alter table public.candidate_approvals enable row level security;

create policy "Allow all authenticated users to view candidate approvals"
  on public.candidate_approvals for select
  to authenticated
  using (true);

create policy "Allow authenticated users to insert candidate approvals"
  on public.candidate_approvals for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update candidate approvals"
  on public.candidate_approvals for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete candidate approvals"
  on public.candidate_approvals for delete
  to authenticated
  using (true);
