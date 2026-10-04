-- Add schedule and session fields to training_courses
alter table training_courses add column if not exists scheduled_date date;
alter table training_courses add column if not exists start_time text;
alter table training_courses add column if not exists end_time text;
alter table training_courses add column if not exists location text;
alter table training_courses add column if not exists created_by_name text;

create index if not exists idx_training_courses_scheduled_date on training_courses(scheduled_date);
