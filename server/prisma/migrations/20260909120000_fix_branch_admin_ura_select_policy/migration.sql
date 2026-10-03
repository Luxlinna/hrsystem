-- Migration: Fix Branch Admin user_role_assignments RLS policy and get_my_branch_id for Phone Users
-- Ensures BU Admins and BU CEO Admins can view and manage all users within their Business Unit,
-- including phone login accounts and accounts with empty string phone fields.

-- 1. Update get_my_branch_id() to safely match phone users and avoid empty strings
CREATE OR REPLACE FUNCTION public.get_my_branch_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.branch_id
  FROM employees e
  WHERE (
    (e.email IS NOT NULL AND trim(e.email) <> '' AND lower(trim(e.email)) = lower(trim(auth.jwt() ->> 'email')))
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      WHERE ura.user_id = auth.uid()
        AND ura.deleted_at IS NULL
        AND (
          (e.email IS NOT NULL AND trim(e.email) <> '' AND lower(trim(e.email)) = lower(trim(ura.email)))
          OR (
            length(regexp_replace(coalesce(e.phone, ''), '\D', '', 'g')) >= 6
            AND length(regexp_replace(coalesce(split_part(ura.email, '@', 1), ''), '\D', '', 'g')) >= 6
            AND (
              regexp_replace(split_part(ura.email, '@', 1), '\D', '', 'g') = regexp_replace(e.phone, '\D', '', 'g')
              OR (
                ura.email LIKE '%@phone.hrmsystem.local'
                AND (
                  regexp_replace(split_part(ura.email, '@', 1), '\D', '', 'g') LIKE concat('%', regexp_replace(e.phone, '\D', '', 'g'))
                  OR regexp_replace(e.phone, '\D', '', 'g') LIKE concat('%', regexp_replace(split_part(ura.email, '@', 1), '\D', '', 'g'))
                )
              )
            )
          )
        )
    )
    OR (
      length(regexp_replace(coalesce(e.phone, ''), '\D', '', 'g')) >= 6
      AND length(regexp_replace(coalesce(split_part(auth.jwt() ->> 'email', '@', 1), ''), '\D', '', 'g')) >= 6
      AND (
        regexp_replace(split_part(auth.jwt() ->> 'email', '@', 1), '\D', '', 'g') = regexp_replace(e.phone, '\D', '', 'g')
        OR (
          (auth.jwt() ->> 'email') LIKE '%@phone.hrmsystem.local'
          AND (
            regexp_replace(split_part(auth.jwt() ->> 'email', '@', 1), '\D', '', 'g') LIKE concat('%', regexp_replace(e.phone, '\D', '', 'g'))
            OR regexp_replace(e.phone, '\D', '', 'g') LIKE concat('%', regexp_replace(split_part(auth.jwt() ->> 'email', '@', 1), '\D', '', 'g'))
          )
        )
      )
    )
  )
  AND e.deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_branch_id() TO authenticated;

-- 2. Update ura_select_own_or_admin policy
DROP POLICY IF EXISTS "ura_select_own_or_admin" ON public.user_role_assignments;

CREATE POLICY "ura_select_own_or_admin" ON public.user_role_assignments
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR lower(email) = lower(auth.jwt() ->> 'email')
  OR public.is_super_admin()
  OR (
    public.is_branch_admin()
    AND EXISTS (
      SELECT 1
      FROM employees branch_emp
      WHERE branch_emp.branch_id = public.get_my_branch_id()
        AND branch_emp.deleted_at IS NULL
        AND (
          (
            branch_emp.email IS NOT NULL
            AND trim(branch_emp.email) <> ''
            AND lower(trim(branch_emp.email)) = lower(trim(user_role_assignments.email))
          )
          OR (
            length(regexp_replace(coalesce(branch_emp.phone, ''), '\D', '', 'g')) >= 6
            AND length(regexp_replace(coalesce(split_part(user_role_assignments.email, '@', 1), ''), '\D', '', 'g')) >= 6
            AND (
              regexp_replace(split_part(user_role_assignments.email, '@', 1), '\D', '', 'g') = regexp_replace(branch_emp.phone, '\D', '', 'g')
              OR (
                user_role_assignments.email LIKE '%@phone.hrmsystem.local'
                AND (
                  regexp_replace(split_part(user_role_assignments.email, '@', 1), '\D', '', 'g') LIKE concat('%', regexp_replace(branch_emp.phone, '\D', '', 'g'))
                  OR regexp_replace(branch_emp.phone, '\D', '', 'g') LIKE concat('%', regexp_replace(split_part(user_role_assignments.email, '@', 1), '\D', '', 'g'))
                )
              )
            )
          )
        )
    )
  )
);
