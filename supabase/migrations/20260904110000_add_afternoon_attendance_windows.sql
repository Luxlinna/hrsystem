-- Migration: Add afternoon attendance scan windows for branch & work_site management
-- Allows Branch Admin and Super Admin to configure afternoon check-in (e.g. 12:00 - 14:00) 
-- and afternoon check-out (e.g. 16:00 - 18:00) windows.

ALTER TABLE public.work_locations
  ADD COLUMN IF NOT EXISTS afternoon_check_in_start time without time zone DEFAULT '12:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_in_end time without time zone DEFAULT '14:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_out_start time without time zone DEFAULT '16:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_out_end time without time zone DEFAULT '18:00:00';

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS afternoon_check_in_start time without time zone DEFAULT '12:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_in_end time without time zone DEFAULT '14:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_out_start time without time zone DEFAULT '16:00:00',
  ADD COLUMN IF NOT EXISTS afternoon_check_out_end time without time zone DEFAULT '18:00:00';

-- Add default company-wide settings if not exists
INSERT INTO public.system_settings (key, value, type)
VALUES 
  ('afternoon_check_in_start', '12:00', 'time'),
  ('afternoon_check_in_end', '14:00', 'time'),
  ('afternoon_check_out_start', '16:00', 'time'),
  ('afternoon_check_out_end', '18:00', 'time')
ON CONFLICT (key) DO NOTHING;
