-- Migration: Add standard asset inventory fields to it_assets table
ALTER TABLE it_assets
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'New',
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS site TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Backfill category from type if category is null
UPDATE it_assets
SET category = type
WHERE category IS NULL AND type IS NOT NULL;
