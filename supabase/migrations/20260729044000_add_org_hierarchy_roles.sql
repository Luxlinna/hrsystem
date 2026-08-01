-- Add the full org hierarchy above/around the existing roles: Chairman and
-- CEO (executive oversight), Admin Manager (ops/IT admin), Department
-- Manager (team-level HR ops), and HR Staff (day-to-day HR operations).
-- Auth accounts were created via Admin API, matching the pattern used for
-- the original 3 demo accounts and the later "Staff" role.

insert into app_roles (name, description, color, is_admin, allowed_modules) values
  ('Chairman', 'Board-level strategic oversight', '#1E293B', false,
    array['dashboard','analytics','reports','org-chart','branches','finance','payroll-approval','audit-log','announcements','notifications']),
  ('CEO', 'Full operational oversight across the company', '#DC2626', false,
    array['dashboard','employees','branches','analytics','onboarding','onboarding-checklist','leave','leave-calendar','hire','offboard','org-chart','performance','attendance','training','disciplinary','shifts','payroll','payroll-approval','finance','it-management','benefits','tools','announcements','documents','reports','audit-log','self-service','notifications','unity-apps']),
  ('Admin Manager', 'Operations and IT systems administration', '#2563EB', false,
    array['dashboard','branches','it-management','tools','unity-apps','settings','documents','announcements','notifications','audit-log']),
  ('Department Manager', 'Manages team workforce, leave, and performance', '#DB2777', false,
    array['dashboard','employees','analytics','onboarding','leave','leave-calendar','performance','attendance','training','disciplinary','shifts','benefits','announcements','documents','reports','self-service','notifications','org-chart']),
  ('HR Staff', 'Day-to-day HR operations: onboarding, leave, hiring', '#0369A1', false,
    array['dashboard','employees','onboarding','onboarding-checklist','leave','leave-calendar','hire','offboard','org-chart','performance','attendance','training','disciplinary','shifts','benefits','announcements','documents','self-service','notifications','reports']);

insert into user_role_assignments (user_id, email, display_name, role_id)
select '8132c429-2697-4750-8794-06a045991865'::uuid, 'chairman@hrnexus.com', 'Chairman', id from app_roles where name = 'Chairman';
insert into user_role_assignments (user_id, email, display_name, role_id)
select '8c276c82-f41e-4d7d-897a-857a2dbf70b6'::uuid, 'ceo@hrnexus.com', 'CEO', id from app_roles where name = 'CEO';
insert into user_role_assignments (user_id, email, display_name, role_id)
select 'c04a0870-6535-4240-978e-b416ef3e902d'::uuid, 'adminmanager@hrnexus.com', 'Admin Manager', id from app_roles where name = 'Admin Manager';
insert into user_role_assignments (user_id, email, display_name, role_id)
select '2d35c5ae-4c91-42fd-9ece-d7da0bc306c2'::uuid, 'deptmanager@hrnexus.com', 'Department Manager', id from app_roles where name = 'Department Manager';
insert into user_role_assignments (user_id, email, display_name, role_id)
select 'b994d35b-435a-489c-b606-c595da825770'::uuid, 'hrstaff@hrnexus.com', 'HR Staff', id from app_roles where name = 'HR Staff';
