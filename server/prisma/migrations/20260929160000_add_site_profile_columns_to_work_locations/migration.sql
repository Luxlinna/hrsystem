-- Migration: Add enterprise site profile structure to work_locations table
-- Matching enterprise BU Sites structure:
-- 1. SITE INFO (site_name/name, site_type, company_name)
-- 2. ADDRESS INFO (address, city, province, postal_code, country)
-- 3. CONTACT INFO (phone_number, email, website)
-- 4. STATUS (active, disabled)

ALTER TABLE public.work_locations
  ADD COLUMN IF NOT EXISTS site_type text DEFAULT 'Store',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'Phnom Penh',
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Cambodia',
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
