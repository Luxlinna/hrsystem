-- =========================================================================
-- Employee Profile Professional Background & Candidate Linking
-- =========================================================================

-- 1. Add professional background and candidate fields to employees table
alter table employees
  add column if not exists candidate_id uuid references candidates(id) on delete set null,
  add column if not exists candidate_code text,
  add column if not exists location text,
  add column if not exists education text,
  add column if not exists work_experience text,
  add column if not exists skills text[] default '{}'::text[],
  add column if not exists languages text[] default '{}'::text[],
  add column if not exists expected_salary numeric(12,2),
  add column if not exists notice_period text,
  add column if not exists resume_url text,
  add column if not exists resume_name text;

-- 2. Automatically link existing employees with candidates table by matching email or phone
update employees e
set
  candidate_id = c.id,
  candidate_code = coalesce(e.candidate_code, c.candidate_code),
  location = coalesce(e.location, c.location),
  education = coalesce(e.education, c.education),
  work_experience = coalesce(e.work_experience, c.work_experience),
  skills = case when e.skills is not null and cardinality(e.skills) > 0 then e.skills else c.skills end,
  languages = case when e.languages is not null and cardinality(e.languages) > 0 then e.languages else c.languages end,
  resume_url = coalesce(e.resume_url, c.resume_url),
  resume_name = coalesce(e.resume_name, c.resume_name),
  expected_salary = coalesce(e.expected_salary, c.expected_salary),
  notice_period = coalesce(e.notice_period, c.notice_period)
from candidates c
where (
  (e.email is not null and e.email != '' and lower(e.email) = lower(c.email))
  or
  (e.phone is not null and e.phone != '' and e.phone = c.phone)
);
