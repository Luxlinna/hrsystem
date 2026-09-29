-- Migration: Create contract_types table with RLS and initial seed data
-- Matches the Contract Types management requirements

CREATE TABLE IF NOT EXISTS public.contract_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  term TEXT NOT NULL DEFAULT 'None' CHECK (term IN ('None', 'Probation', 'FDC', 'UDC')),
  period_months INT,
  alert_days_before INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to authenticated users for contract_types"
  ON public.contract_types FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow insert access to authenticated users for contract_types"
  ON public.contract_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users for contract_types"
  ON public.contract_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users for contract_types"
  ON public.contract_types FOR DELETE
  TO authenticated
  USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_contract_types_branch_id ON public.contract_types(branch_id);
CREATE INDEX IF NOT EXISTS idx_contract_types_status ON public.contract_types(status);
CREATE INDEX IF NOT EXISTS idx_contract_types_sort_order ON public.contract_types(sort_order);

-- Seed initial contract types matching system design
INSERT INTO public.contract_types (name, term, period_months, alert_days_before, sort_order, status)
SELECT name, term, period_months, alert_days_before, sort_order, status FROM (
  VALUES
    ('1-YEAR FDC', 'FDC', 12, 30, 1, 'active'),
    ('2-YEAR 3-MONTH FDC', 'FDC', 27, 60, 2, 'active'),
    ('2-YEAR FDC', 'FDC', 24, 60, 3, 'active'),
    ('3-MONTH FDC', 'FDC', 3, 15, 4, 'active'),
    ('3-YEAR FDC', 'FDC', 36, 60, 5, 'active'),
    ('5 YEARS FDC', 'FDC', 60, 30, 6, 'active'),
    ('PERMANENT (UDC)', 'UDC', NULL, 0, 7, 'active'),
    ('PROBATION', 'Probation', 3, 15, 8, 'active')
) AS v(name, term, period_months, alert_days_before, sort_order, status)
WHERE NOT EXISTS (SELECT 1 FROM public.contract_types LIMIT 1);
