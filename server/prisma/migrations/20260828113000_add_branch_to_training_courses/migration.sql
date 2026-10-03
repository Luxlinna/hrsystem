-- Add branch_id to training_courses to distinguish Global/Admin courses from Branch-specific courses
alter table training_courses add column if not exists branch_id uuid references branches(id) on delete set null;

create index if not exists idx_training_courses_branch_id on training_courses(branch_id);
