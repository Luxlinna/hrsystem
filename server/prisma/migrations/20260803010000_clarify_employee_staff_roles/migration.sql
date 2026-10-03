-- "Employee" and "Staff" had almost identical permissions (Staff only
-- additionally had Attendance + Documents) with no stated reason why —
-- looked like leftover demo-data duplication rather than an intentional
-- split. Keeping the module lists as-is (that small difference already
-- matches a real distinction: office/salaried staff vs. hourly/shift
-- staff who need attendance + document access front-and-center) but
-- making it explicit via the description shown on each role's card in
-- the Admin Portal, so it's no longer ambiguous which one to assign.

update app_roles
set description = 'Self-service access for salaried/office employees — leave, training, meeting rooms, and company updates.'
where name = 'Employee';

update app_roles
set description = 'Self-service access for hourly/shift-based staff — adds attendance tracking and document access alongside standard leave and training.'
where name = 'Staff';

update app_roles
set description = 'Manages their own branch''s workforce, leave, attendance, and performance — not other branches.'
where name = 'Branch Manager';
