-- The previous migration (20260922020000) guessed the module list from
-- observed data. Replacing both checks here with the exact definitions
-- read directly from production's pg_constraint, so there's no more
-- guessing involved.
alter table audit_logs drop constraint if exists audit_logs_action_check;
alter table audit_logs add constraint audit_logs_action_check
  check (action = any (array['created','updated','approved','rejected','deleted','processed','cancelled']));

alter table audit_logs drop constraint if exists audit_logs_module_check;
alter table audit_logs add constraint audit_logs_module_check
  check (module = any (array[
    'hire','leave','payroll','onboarding','employees','offboard','it','finance',
    'benefits','tools','unity','branches','settings','meeting_rooms','documents',
    'attendance','performance','announcements','disciplinary','tasks','shifts','reports'
  ]));

-- attendance_records.current_status (added in 20260922010000) has a check
-- constraint in production that was never captured either.
alter table attendance_records drop constraint if exists attendance_records_current_status_check;
alter table attendance_records add constraint attendance_records_current_status_check
  check (current_status = any (array['working','on_break','outside_work','outside_location','checked_out','absent']));

-- documents.file_type's check constraint, also never captured by a migration.
alter table documents drop constraint if exists documents_file_type_check;
alter table documents add constraint documents_file_type_check
  check (file_type = any (array[
    'pdf','doc','docx','xls','xlsx','csv','ppt','pptx','jpg','jpeg','png','gif',
    'webp','svg','txt','md','json','zip','rar','mp4','mp3'
  ]));
