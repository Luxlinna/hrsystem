-- Add employee_level column to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_level TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_employee_level ON public.employees(employee_level);
