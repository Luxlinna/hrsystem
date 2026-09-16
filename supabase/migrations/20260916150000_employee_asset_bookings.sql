-- Migration: Add asset_bookings and asset_attachments to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS asset_bookings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS asset_attachments JSONB DEFAULT '[]'::jsonb;

-- Create GIN indexes for rapid JSON queries if needed
CREATE INDEX IF NOT EXISTS idx_employees_asset_bookings ON employees USING GIN (asset_bookings);
