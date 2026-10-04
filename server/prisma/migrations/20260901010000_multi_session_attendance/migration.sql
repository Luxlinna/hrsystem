-- Migration: 4-Punch Multi-Session Attendance & Branch Site Schedules
-- Supports 2 check-ins & 2 check-outs per day (Morning + Afternoon sessions)

-- 1. Add break punch columns to attendance_records
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS break_out time,
ADD COLUMN IF NOT EXISTS break_in time;

-- 2. Add customizable schedule & GPS geofence to work_locations (branch sites like Kampong Thom)
ALTER TABLE public.work_locations
ADD COLUMN IF NOT EXISTS work_start_time time DEFAULT '07:30:00',
ADD COLUMN IF NOT EXISTS break_start_time time DEFAULT '11:30:00',
ADD COLUMN IF NOT EXISTS break_end_time time DEFAULT '13:00:00',
ADD COLUMN IF NOT EXISTS work_end_time time DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS is_four_punch_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS geofence_radius_m int DEFAULT 100;

-- 3. Add / update Pinex Agro Kampong Thom site
DO $$
DECLARE
  pinex_branch_id uuid;
BEGIN
  SELECT id INTO pinex_branch_id 
  FROM public.branches 
  WHERE name ILIKE '%Pinex Agro%' AND deleted_at IS NULL 
  LIMIT 1;

  IF pinex_branch_id IS NOT NULL THEN
    INSERT INTO public.work_locations (
      branch_id,
      name,
      description,
      is_default,
      work_start_time,
      break_start_time,
      break_end_time,
      work_end_time,
      is_four_punch_enabled,
      latitude,
      longitude,
      geofence_radius_m
    ) VALUES (
      pinex_branch_id,
      'Kampong Thom Site',
      'Kampong Thom Province, Cambodia',
      false,
      '07:30:00',
      '11:30:00',
      '13:00:00',
      '17:00:00',
      true,
      12.7111,
      104.8887,
      100
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
