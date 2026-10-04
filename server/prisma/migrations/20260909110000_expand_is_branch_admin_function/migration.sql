-- Migration: Expand is_branch_admin function to recognize any BU Admin role
-- Eliminates hardcoded 'Branch Admin' string check so roles named 'BU CEO Admin', 'BU Admin',
-- or any custom BU administrative role are properly recognized as branch administrators.

CREATE OR REPLACE FUNCTION public.is_branch_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  select exists (
    select 1
    from user_role_assignments ura
    join app_roles ar on ar.id = ura.role_id
    where (ura.user_id = auth.uid() or lower(ura.email) = lower(auth.jwt() ->> 'email'))
      and (
        ar.is_admin = true
        or ar.name = 'Super Admin'
        or ar.name ILIKE '%branch%admin%'
        or ar.name ILIKE '%bu%admin%'
        or ar.name ILIKE '%bu%ceo%'
        or 'admin' = ANY(ar.allowed_modules)
      )
      and ura.deleted_at is null
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_branch_admin() TO authenticated;
