-- Auto-advance requisitions created by BU CEO Admin / Branch Admin that are currently stuck at Stage 1
-- Move to Stage 2: HR Manager Review (pending_hr_review) and populate branch_approved_by & branch_approved_at

update hiring_requests
set
  status = 'pending_hr_review',
  branch_approved_by = coalesce(branch_approved_by, requested_by_name || ' (BU CEO Admin · ' || coalesce(business_unit, 'Business Unit') || ')'),
  branch_approved_at = coalesce(branch_approved_at, created_at, now()),
  stage_entered_at = coalesce(stage_entered_at, now())
where requisition_id = 'REQ-2026-0021'
   or (
     (status = 'pending' or status = 'pending_branch_review')
     and branch_approved_by is null
     and (
       requested_by_email = '0882446786@phone.hrmsystem.local'
       or requested_by_name ilike '%James HI%'
     )
   );
