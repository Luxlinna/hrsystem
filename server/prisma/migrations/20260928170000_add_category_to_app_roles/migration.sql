-- Add category column to app_roles to support role positions organized under canonical categories
alter table public.app_roles add column if not exists category text;

-- Initialize canonical categories for existing roles
update public.app_roles set category = 'super_admin' where is_admin = true or lower(name) = 'super admin';
update public.app_roles set category = 'chairperson' where lower(name) like '%chair%';
update public.app_roles set category = 'line_manager' where lower(name) like '%line%manager%' or lower(name) like '%supervisor%';
update public.app_roles set category = 'employee' where (lower(name) like '%employee%' or lower(name) like '%staff%') and category is null;
update public.app_roles set category = 'admin' where category is null;
