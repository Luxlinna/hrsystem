-- Critical fix: the "Employee" role's allowed_modules had drifted to
-- contain a literal '*' entry plus nearly every module in the system.
-- usePermissions.can()/isAdmin both treat a '*' entry in allowed_modules
-- as a full wildcard, so every Employee-role user currently has silent
-- Super Admin rights (including Admin Portal access) instead of the
-- intended self-service-only scope. Reset to the documented baseline:
-- self-service, leave, training, meeting rooms, own records (plus the
-- company-wide tasks module every role already has).

update app_roles
set allowed_modules = array['dashboard','self-service','leave','leave-calendar','notifications','announcements','training','meeting-rooms','tasks']
where name = 'Employee';
