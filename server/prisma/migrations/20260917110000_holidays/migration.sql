-- Create holidays table for Cambodia Labor Law & Company holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  local_name TEXT,
  year INTEGER NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated read holidays" ON public.holidays;
CREATE POLICY "Allow all authenticated read holidays" ON public.holidays
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow all authenticated insert holidays" ON public.holidays;
CREATE POLICY "Allow all authenticated insert holidays" ON public.holidays
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated update holidays" ON public.holidays;
CREATE POLICY "Allow all authenticated update holidays" ON public.holidays
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated delete holidays" ON public.holidays;
CREATE POLICY "Allow all authenticated delete holidays" ON public.holidays
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON public.holidays(year);
CREATE INDEX IF NOT EXISTS idx_holidays_branch_id ON public.holidays(branch_id);
