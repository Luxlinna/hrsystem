-- Migration: Add ZKTeco Biometric Fingerprint Integration
-- Description: Adds biometric_user_id to employees, biometric_devices registry, and biometric_raw_logs

-- 1. Add biometric_user_id to employees if not exists
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS biometric_user_id text;

CREATE INDEX IF NOT EXISTS idx_employees_biometric_user_id 
ON public.employees (biometric_user_id);

-- 2. Biometric Devices Registry Table
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  device_name text NOT NULL,
  device_serial text UNIQUE NOT NULL,
  device_ip text,
  device_port int DEFAULT 4370,
  device_model text,
  firmware_version text,
  user_count int DEFAULT 0,
  fingerprint_count int DEFAULT 0,
  log_count int DEFAULT 0,
  status text DEFAULT 'online' CHECK (status IN ('online', 'offline', 'error')),
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Biometric Raw Punch Logs Table (for hardware audit trail)
CREATE TABLE IF NOT EXISTS public.biometric_raw_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_serial text NOT NULL,
  biometric_user_id text NOT NULL,
  punch_time timestamptz NOT NULL,
  punch_state int DEFAULT 0, -- 0: Check-In, 1: Check-Out, 2: Break-Out, 3: Break-In, 4: Overtime-In, 5: Overtime-Out
  verify_type int DEFAULT 1, -- 1: Fingerprint, 2: Password, 3: Card, 15: Face
  processed boolean DEFAULT false,
  attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biometric_raw_logs_user_time 
ON public.biometric_raw_logs (biometric_user_id, punch_time);

-- 4. Enable RLS
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_raw_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "biometric_devices_admin_read" ON public.biometric_devices;
CREATE POLICY "biometric_devices_admin_read" ON public.biometric_devices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "biometric_devices_admin_modify" ON public.biometric_devices;
CREATE POLICY "biometric_devices_admin_modify" ON public.biometric_devices
  FOR ALL TO authenticated USING (
    public.is_super_admin() OR public.is_branch_admin()
  );

DROP POLICY IF EXISTS "biometric_raw_logs_admin_read" ON public.biometric_raw_logs;
CREATE POLICY "biometric_raw_logs_admin_read" ON public.biometric_raw_logs
  FOR SELECT TO authenticated USING (true);
