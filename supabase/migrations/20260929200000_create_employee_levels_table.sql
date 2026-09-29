-- Migration: Create employee_levels table with RLS and initial setup
-- Matches the Employee Levels management requirements

CREATE TABLE IF NOT EXISTS public.employee_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.employee_levels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to authenticated users for employee_levels"
  ON public.employee_levels FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow insert access to authenticated users for employee_levels"
  ON public.employee_levels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users for employee_levels"
  ON public.employee_levels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users for employee_levels"
  ON public.employee_levels FOR DELETE
  TO authenticated
  USING (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_employee_levels_branch_id ON public.employee_levels(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_levels_status ON public.employee_levels(status);
CREATE INDEX IF NOT EXISTS idx_employee_levels_sort_order ON public.employee_levels(sort_order);
