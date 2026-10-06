-- Migration: Add is_biometrics_enabled to branches
-- Allows configuring whether a Company / Business Unit utilizes physical Biometric Machines (ZKTeco).

ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS is_biometrics_enabled boolean DEFAULT false;
