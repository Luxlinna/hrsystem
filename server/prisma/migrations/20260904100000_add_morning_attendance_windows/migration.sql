-- Migration: Add morning attendance scan windows for branch & work_site management
-- Allows Branch Admin and Super Admin to configure check-in (e.g. 06:00 - 09:00) 
-- and check-out (e.g. 10:00 - 12:00) windows.

ALTER TABLE public.work_locations
  ADD COLUMN IF NOT EXISTS morning_check_in_start time without time zone DEFAULT '06:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_in_end time without time zone DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_out_start time without time zone DEFAULT '10:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_out_end time without time zone DEFAULT '12:00:00';

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS morning_check_in_start time without time zone DEFAULT '06:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_in_end time without time zone DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_out_start time without time zone DEFAULT '10:00:00',
  ADD COLUMN IF NOT EXISTS morning_check_out_end time without time zone DEFAULT '12:00:00';

-- Add default company-wide settings if not exists
INSERT INTO public.system_settings (key, value, type)
VALUES 
  ('morning_check_in_start', '06:00', 'time'),
  ('morning_check_in_end', '09:00', 'time'),
  ('morning_check_out_start', '10:00', 'time'),
  ('morning_check_out_end', '12:00', 'time')
ON CONFLICT (key) DO NOTHING;
