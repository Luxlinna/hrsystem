-- =========================================================================
-- Candidate Master Database & Application History
-- =========================================================================

-- 1. Add Candidate Master Profile Columns to candidates table
alter table candidates
  add column if not exists candidate_code text unique,
  add column if not exists location text,
  add column if not exists education text,
  add column if not exists work_experience text,
  add column if not exists skills text[] default '{}'::text[],
  add column if not exists languages text[] default '{}'::text[],
  add column if not exists expected_salary numeric(12,2),
  add column if not exists notice_period text,
  add column if not exists assigned_recruiter_id uuid references employees(id) on delete set null,
  add column if not exists tags text[] default '{}'::text[];

-- 2. Sequence and Trigger for Sequential Candidate ID (CAN-YYYY-000001)
create sequence if not exists candidate_code_seq;

create or replace function generate_candidate_code()
returns trigger as $$
declare
  next_val int;
  yr text;
begin
  if new.candidate_code is null or new.candidate_code = '' then
    select nextval('candidate_code_seq') into next_val;
    yr := to_char(coalesce(new.applied_at, now()), 'YYYY');
    new.candidate_code := 'CAN-' || yr || '-' || lpad(next_val::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_candidate_code on candidates;
create trigger trg_generate_candidate_code
before insert on candidates
for each row
execute function generate_candidate_code();

-- 3. Backfill existing candidates with sequential candidate_code
do $$
declare
  r record;
  seq_counter int := 1;
  yr text;
begin
  for r in select id, coalesce(applied_at, now()) as dt from candidates where candidate_code is null order by coalesce(applied_at, now()) asc loop
    yr := to_char(r.dt, 'YYYY');
    update candidates
    set candidate_code = 'CAN-' || yr || '-' || lpad(seq_counter::text, 6, '0')
    where id = r.id;
    seq_counter := seq_counter + 1;
  end loop;

  -- Synchronize sequence
  perform setval('candidate_code_seq', greatest(seq_counter, 1));
end $$;

-- 4. Candidate Applications Table (Reusable Candidate Profile across applications)
create table if not exists candidate_applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  job_posting_id uuid references job_postings(id) on delete set null,
  stage text not null default 'applied' check (stage in ('applied','screening','interview','offer','hired','rejected')),
  rating int check (rating between 1 and 5),
  source text,
  applied_at timestamptz not null default now(),
  outcome text default 'in_progress' check (outcome in ('in_progress','hired','rejected','withdrawn','on_hold')),
  outcome_notes text,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexing for fast search and history retrieval
create index if not exists idx_candidates_candidate_code on candidates(candidate_code);
create index if not exists idx_candidates_assigned_recruiter on candidates(assigned_recruiter_id);
create index if not exists idx_candidate_apps_candidate_id on candidate_applications(candidate_id);
create index if not exists idx_candidate_apps_job_posting_id on candidate_applications(job_posting_id);

-- 5. Backfill candidate_applications for existing candidates linked to jobs
insert into candidate_applications (candidate_id, job_posting_id, stage, rating, source, applied_at, outcome, notes)
select
  c.id,
  c.job_posting_id,
  coalesce(c.stage, 'applied'),
  c.rating,
  c.source,
  coalesce(c.applied_at, now()),
  case
    when c.stage = 'hired' then 'hired'
    when c.stage = 'rejected' then 'rejected'
    else 'in_progress'
  end,
  c.notes
from candidates c
where c.job_posting_id is not null
  and not exists (
    select 1 from candidate_applications ca
    where ca.candidate_id = c.id and ca.job_posting_id = c.job_posting_id
  );
