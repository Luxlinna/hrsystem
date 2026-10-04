-- audit_logs.module's check constraint only listed the modules known when the
-- table was created. Production has been logging several more (announcements,
-- attendance, disciplinary, meeting_rooms, performance) that were never added
-- here, which blocks any data-only restore of real audit_logs rows.
alter table audit_logs drop constraint if exists audit_logs_module_check;
alter table audit_logs add constraint audit_logs_module_check
  check (module in (
    'hire','leave','payroll','onboarding','employees','offboard','it','finance',
    'benefits','tools','unity','branches','settings',
    'announcements','attendance','disciplinary','meeting_rooms','performance'
  ));
