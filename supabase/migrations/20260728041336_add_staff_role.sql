-- Add a 4th demo role/account: general "Staff" self-service access, alongside
-- the existing Super Admin / HR Manager / Employee accounts created via Admin API.

insert into app_roles (name, description, color, is_admin, allowed_modules) values
  ('Staff', 'General staff self-service access', '#F59E0B', false,
    array['dashboard','self-service','leave','leave-calendar','attendance','documents','notifications','announcements','training'])
  on conflict (name) do nothing;

do $$
begin
  insert into user_role_assignments (user_id, email, display_name, role_id)
  select '55d667aa-7944-4007-880f-93f10da7cd69'::uuid, 'staff@hrnexus.com', 'Demo Staff', id from app_roles where name = 'Staff';
exception when others then null;
end $$;
