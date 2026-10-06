-- Migration: Fix leave request cancellation and role permission checks
-- 1. Enhanced my_employee_id() to support email, user_id, auth_id, and phone
CREATE OR REPLACE FUNCTION public.my_employee_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id
  FROM employees
  WHERE (
    (auth.jwt() ->> 'email' IS NOT NULL AND lower(coalesce(email, '')) = lower(auth.jwt() ->> 'email'))
    OR (auth.jwt() ->> 'phone' IS NOT NULL AND coalesce(phone, '') = (auth.jwt() ->> 'phone'))
    OR (auth.jwt() ->> 'email' IS NOT NULL AND coalesce(email, '') ILIKE '%' || split_part(auth.jwt() ->> 'email', '@', 1) || '%')
  )
  AND deleted_at IS NULL
  LIMIT 1;
$$;

-- 2. Enhanced can_approve_leave() to include managers, BU admins, branch admins, and HR
CREATE OR REPLACE FUNCTION public.can_approve_leave()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT ar.is_admin 
          OR ar.allowed_modules @> '{"*"}' 
          OR ar.leave_approve 
          OR ar.leave_manager_endorse 
          OR ar.leave_bu_admin_endorse
          OR ar.name IN ('Super Admin', 'HR Manager', 'Branch Manager', 'Department Manager', 'HR Staff', 'CEO', 'Branch Admin', 'Admin')
      FROM user_role_assignments ura
      JOIN app_roles ar ON ar.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.deleted_at IS NULL
      LIMIT 1
    ),
    false
  );
$$;

-- 3. Update trigger to allow cancelling pending leave requests
CREATE OR REPLACE FUNCTION public.enforce_leave_approval_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No JWT = service_role / trusted backend context, which already bypasses RLS
  IF auth.uid() IS NULL THEN
    RETURN new;
  END IF;

  IF new.status IS DISTINCT FROM old.status THEN
    -- Approving requires approval permission
    IF new.status = 'approved' AND NOT public.can_approve_leave() THEN
      RAISE EXCEPTION 'Your role is not permitted to approve leave requests'
        USING errcode = '42501';
    END IF;

    -- Rejecting someone else's request requires approver permission
    IF new.status = 'rejected'
       AND NOT public.can_approve_leave()
       AND new.employee_id IS DISTINCT FROM public.my_employee_id() THEN
      RAISE EXCEPTION 'Your role is not permitted to reject leave requests'
        USING errcode = '42501';
    END IF;

    -- Cancelling an already approved request for someone else requires approver / admin permission
    IF new.status = 'cancelled'
       AND old.status = 'approved'
       AND NOT public.can_approve_leave()
       AND new.employee_id IS DISTINCT FROM public.my_employee_id() THEN
      RAISE EXCEPTION 'Your role is not permitted to cancel approved leave requests'
        USING errcode = '42501';
    END IF;
  END IF;

  RETURN new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_approve_leave() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_employee_id() TO authenticated;
