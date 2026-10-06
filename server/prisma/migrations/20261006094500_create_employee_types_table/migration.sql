-- Create employee_types table
CREATE TABLE IF NOT EXISTS employee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  remark TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ(6)
);

CREATE INDEX IF NOT EXISTS idx_employee_types_branch_id ON employee_types (branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_types_sort_order ON employee_types (sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_types_status ON employee_types (status);
CREATE INDEX IF NOT EXISTS idx_employee_types_deleted_at ON employee_types (deleted_at);

-- Seed default standard employee types
INSERT INTO employee_types (name, sort_order, status)
VALUES 
  ('FULL-TIME', 1, 'active'),
  ('HOD', 2, 'active'),
  ('INTERNSHIP', 3, 'active'),
  ('PART-TIME', 4, 'active')
ON CONFLICT DO NOTHING;
