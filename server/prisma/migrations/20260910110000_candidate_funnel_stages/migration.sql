-- 13-Stage Candidate Lifecycle Funnel
-- Allows management and recruiters to track candidates across the full hiring lifecycle:
-- CV Received -> Screening -> Shortlisted -> HR Interview -> Hiring Manager Interview
-- -> Final Interview -> Selected -> Salary Negotiation -> Offer -> Accepted
-- -> Documents -> Contract -> Hired (+ Rejected)

-- Drop existing check constraints on candidates table
alter table if exists candidates
  drop constraint if exists candidates_stage_check;

alter table if exists candidates
  add constraint candidates_stage_check check (
    stage in (
      'applied',
      'cv_received',
      'screening',
      'shortlisted',
      'interview',
      'hr_interview',
      'hiring_manager_interview',
      'final_interview',
      'selected',
      'salary_negotiation',
      'offer',
      'accepted',
      'documents',
      'contract',
      'hired',
      'rejected'
    )
  );

-- Drop and update check constraints on candidate_applications table
alter table if exists candidate_applications
  drop constraint if exists candidate_applications_stage_check;

alter table if exists candidate_applications
  add constraint candidate_applications_stage_check check (
    stage in (
      'applied',
      'cv_received',
      'screening',
      'shortlisted',
      'interview',
      'hr_interview',
      'hiring_manager_interview',
      'final_interview',
      'selected',
      'salary_negotiation',
      'offer',
      'accepted',
      'documents',
      'contract',
      'hired',
      'rejected'
    )
  );

-- Update column defaults to 'cv_received'
alter table if exists candidates
  alter column stage set default 'cv_received';

alter table if exists candidate_applications
  alter column stage set default 'cv_received';
