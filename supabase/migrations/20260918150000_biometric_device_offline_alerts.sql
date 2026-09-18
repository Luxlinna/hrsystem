-- Migration: Add offline alert tracking columns to biometric_devices and settings to system_settings

-- 1. Add alert tracking columns to biometric_devices
ALTER TABLE public.biometric_devices
  ADD COLUMN IF NOT EXISTS alerted_offline BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_offline_alert_at TIMESTAMPTZ;

-- 2. Insert default settings if they do not exist
INSERT INTO public.system_settings (key, value, type, updated_at)
VALUES 
  ('biometric_offline_alert_enabled', 'true', 'boolean', NOW()),
  ('biometric_offline_threshold_minutes', '60', 'number', NOW())
ON CONFLICT (key) DO NOTHING;
