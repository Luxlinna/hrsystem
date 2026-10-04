-- Migration: Add late_grace_minutes and early_leave_grace_minutes to branches and work_locations
-- Allows Branch Admins and Super Admins to configure grace minutes per branch / site.

ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS late_grace_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS early_leave_grace_minutes integer DEFAULT 15;

ALTER TABLE public.work_locations
ADD COLUMN IF NOT EXISTS late_grace_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS early_leave_grace_minutes integer DEFAULT 15;
