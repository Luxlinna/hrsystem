CREATE TABLE IF NOT EXISTS public.overtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  overtime_type TEXT NOT NULL DEFAULT 'Normal Overtime (1.5x)',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  remark TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated read overtime_records" ON public.overtime_records;
CREATE POLICY "Allow all authenticated read overtime_records" ON public.overtime_records
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow all authenticated insert overtime_records" ON public.overtime_records;
CREATE POLICY "Allow all authenticated insert overtime_records" ON public.overtime_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated update overtime_records" ON public.overtime_records;
CREATE POLICY "Allow all authenticated update overtime_records" ON public.overtime_records
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated delete overtime_records" ON public.overtime_records;
CREATE POLICY "Allow all authenticated delete overtime_records" ON public.overtime_records
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_overtime_employee_id ON public.overtime_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_branch_id ON public.overtime_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_overtime_from_date ON public.overtime_records(from_date);
