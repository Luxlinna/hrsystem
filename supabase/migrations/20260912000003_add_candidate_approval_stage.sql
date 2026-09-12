-- Add 'candidate_approval' to candidates and candidate_applications stage check constraints

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
      'candidate_approval',
      'salary_negotiation',
      'offer',
      'accepted',
      'documents',
      'contract',
      'hired',
      'rejected'
    )
  );

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
      'candidate_approval',
      'salary_negotiation',
      'offer',
      'accepted',
      'documents',
      'contract',
      'hired',
      'rejected'
    )
  );
