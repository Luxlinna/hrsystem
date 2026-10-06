-- Migration: Add is_auto_checkout_enabled and auto_checkout_time to branches and work_locations
-- Allows administrators to configure auto check-out cutoff times per Business Unit / site.

ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS is_auto_checkout_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_checkout_time time DEFAULT '18:00:00'::time;

ALTER TABLE public.work_locations
ADD COLUMN IF NOT EXISTS is_auto_checkout_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_checkout_time time DEFAULT '18:00:00'::time;
