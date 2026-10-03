-- Align app_roles permissions for recruitment pipeline:
-- Stage 1: Branch / BU CEO Admin (hiring_requests_branch_approve = true)
-- Stage 2: HR Manager (hiring_requests_hr_review = true)
-- Stage 3: HR Admin Director (hiring_requests_hr_admin_approve = true)
-- Stage 4: Chairwoman (hiring_requests_chairman_approve = true)

update app_roles set
  hiring_requests_branch_approve = false,
  hiring_requests_hr_review = true,
  hiring_requests_hr_admin_approve = false,
  hiring_requests_chairman_approve = false
where name = 'HR Manager';

update app_roles set
  hiring_requests_branch_approve = false,
  hiring_requests_hr_review = false,
  hiring_requests_hr_admin_approve = true,
  hiring_requests_chairman_approve = false
where name = 'HR Admin Director';

update app_roles set
  hiring_requests_branch_approve = true,
  hiring_requests_hr_review = false,
  hiring_requests_hr_admin_approve = false,
  hiring_requests_chairman_approve = false
where name in ('BU CEO Admin', 'Branch Admin', 'Branch Manager');

update app_roles set
  hiring_requests_branch_approve = true,
  hiring_requests_hr_review = false,
  hiring_requests_hr_admin_approve = false,
  hiring_requests_chairman_approve = true
where name in ('Chairwoman', 'Chairman');

update app_roles set
  hiring_requests_branch_approve = false
where name in ('IT Manager', 'Employee');

