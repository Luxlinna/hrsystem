-- Add site, employee_level, contract_type, employee_type columns to hiring_requests table
ALTER TABLE hiring_requests
  ADD COLUMN IF NOT EXISTS site TEXT,
  ADD COLUMN IF NOT EXISTS employee_level TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS employee_type TEXT;

CREATE INDEX IF NOT EXISTS idx_hiring_requests_employee_level ON hiring_requests(employee_level);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_contract_type ON hiring_requests(contract_type);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_site ON hiring_requests(site);
