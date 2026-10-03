-- Migration: Create employee_types table with RLS and initial seed data
-- Matches the Employee Types management requirements

CREATE TABLE IF NOT EXISTS public.employee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to authenticated users for employee_types"
  ON public.employee_types FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow insert access to authenticated users for employee_types"
  ON public.employee_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users for employee_types"
  ON public.employee_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users for employee_types"
  ON public.employee_types FOR DELETE
  TO authenticated
  USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_employee_types_branch_id ON public.employee_types(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_types_status ON public.employee_types(status);
CREATE INDEX IF NOT EXISTS idx_employee_types_sort_order ON public.employee_types(sort_order);

-- Seed initial employee types if empty
INSERT INTO public.employee_types (name, sort_order, status)
SELECT name, sort_order, status FROM (
  VALUES
    ('FULL-TIME', 1, 'active'),
    ('HOD', 2, 'active'),
    ('INTERNSHIP', 3, 'active'),
    ('PART-TIME', 4, 'active')
) AS v(name, sort_order, status)
WHERE NOT EXISTS (SELECT 1 FROM public.employee_types LIMIT 1);
