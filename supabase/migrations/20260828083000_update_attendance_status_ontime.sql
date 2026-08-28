-- Update attendance_records status check constraint to include 'ontime' and set default 'ontime'
alter table public.attendance_records drop constraint if exists attendance_records_status_check;

alter table public.attendance_records add constraint attendance_records_status_check
  check (status in ('ontime', 'present', 'absent', 'late', 'half_day', 'remote', 'wfh', 'holiday'));

alter table public.attendance_records alter column status set default 'ontime';

update public.attendance_records set status = 'ontime' where status = 'present';
