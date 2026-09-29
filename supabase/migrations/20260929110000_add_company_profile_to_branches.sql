-- Migration: Add Complete Company Profile Structure to branches table
-- Structured sections matching enterprise Company Profile:
-- 1. COMPANY INFO (logo, company name, registration no, VAT no, industry, domain, currency, rounding digit)
-- 2. PHYSICAL ADDRESS INFO (address, city, province, postal code, country)
-- 3. MAILING ADDRESS INFO (address, city, province, postal code, country)
-- 4. CONTACT INFO (phone number, email, website)
-- 5. TIMEZONE INFO (time zone)
-- 6. LEGAL INFO (tax number, legal name, business activity, address, phone number, email)

ALTER TABLE public.branches
  -- Company Info
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS registration_no text,
  ADD COLUMN IF NOT EXISTS vat_no text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS rounding_digit integer DEFAULT 2,

  -- Physical Address Info
  ADD COLUMN IF NOT EXISTS physical_address text,
  ADD COLUMN IF NOT EXISTS physical_city text,
  ADD COLUMN IF NOT EXISTS physical_province text,
  ADD COLUMN IF NOT EXISTS physical_postal_code text,
  ADD COLUMN IF NOT EXISTS physical_country text,

  -- Mailing Address Info
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS mailing_city text,
  ADD COLUMN IF NOT EXISTS mailing_province text,
  ADD COLUMN IF NOT EXISTS mailing_postal_code text,
  ADD COLUMN IF NOT EXISTS mailing_country text,

  -- Contact Info
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,

  -- Timezone Info
  ADD COLUMN IF NOT EXISTS time_zone text DEFAULT 'SE Asia Standard Time',

  -- Legal Info
  ADD COLUMN IF NOT EXISTS legal_tax_number text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS legal_business_activity text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS legal_phone_number text,
  ADD COLUMN IF NOT EXISTS legal_email text;
