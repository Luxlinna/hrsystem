alter table notifications drop constraint if exists notifications_source_check;

alter table notifications
  add constraint notifications_source_check
  check (source is null or source in (
    'hire',
    'leave',
    'payroll',
    'branches',
    'system',
    'employees',
    'onboarding',
    'offboard',
    'finance',
    'it_management',
    'benefits',
    'tools',
    'announcements'
  )) not valid;
