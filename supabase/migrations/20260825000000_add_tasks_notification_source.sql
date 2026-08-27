-- Allow "tasks" notifications (sent when a task is assigned/reassigned to
-- an employee, see notifyTaskAssignees in src/pages/tasks/page.tsx).

alter table notifications drop constraint if exists notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source in (
    'hire','leave','payroll','branches','system','employees','onboarding','offboard','finance',
    'it_management','benefits','training','tools','announcements','meeting_rooms','meeting-rooms',
    'password_reset','attendance','tasks'
  ));
