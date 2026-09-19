-- Migration: Add granular leave endorsement and approval permissions to app_roles
ALTER TABLE public.app_roles
  ADD COLUMN IF NOT EXISTS leave_manager_endorse boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leave_bu_admin_endorse boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.app_roles.leave_manager_endorse IS 'Stage 1: Can review & endorse leave applications for direct team members';
COMMENT ON COLUMN public.app_roles.leave_bu_admin_endorse IS 'Stage 1: Can review & endorse leave applications for Department Managers at BU level';
COMMENT ON COLUMN public.app_roles.leave_approve IS 'Stage 2: Can grant final HR Division authorization for all leave requests';
