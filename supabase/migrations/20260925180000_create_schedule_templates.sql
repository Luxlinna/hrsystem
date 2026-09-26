-- =========================================================================
-- Schedule Templates & Shift Definitions Migration
-- =========================================================================

-- 1. Extend shifts table with code and rule fields if not present
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS time_table JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS tolerance_rules JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS must_mark_check_in BOOLEAN DEFAULT true;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS must_mark_check_out BOOLEAN DEFAULT true;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_overnight BOOLEAN DEFAULT false;

-- 2. Create schedule_templates table
CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  site_id UUID REFERENCES public.work_locations(id) ON DELETE SET NULL,
  site_name TEXT DEFAULT 'All',
  monday TEXT NOT NULL DEFAULT 'OFF',
  tuesday TEXT NOT NULL DEFAULT 'OFF',
  wednesday TEXT NOT NULL DEFAULT 'OFF',
  thursday TEXT NOT NULL DEFAULT 'OFF',
  friday TEXT NOT NULL DEFAULT 'OFF',
  saturday TEXT NOT NULL DEFAULT 'OFF',
  sunday TEXT NOT NULL DEFAULT 'OFF',
  days JSONB DEFAULT '{}'::jsonb,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated read schedule_templates" ON public.schedule_templates;
CREATE POLICY "Allow all authenticated read schedule_templates" ON public.schedule_templates
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow all authenticated insert schedule_templates" ON public.schedule_templates;
CREATE POLICY "Allow all authenticated insert schedule_templates" ON public.schedule_templates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated update schedule_templates" ON public.schedule_templates;
CREATE POLICY "Allow all authenticated update schedule_templates" ON public.schedule_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated delete schedule_templates" ON public.schedule_templates;
CREATE POLICY "Allow all authenticated delete schedule_templates" ON public.schedule_templates
  FOR DELETE TO authenticated USING (true);

-- 3. Create schedule_template_assignments table
CREATE TABLE IF NOT EXISTS public.schedule_template_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.schedule_templates(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_template_employee UNIQUE (template_id, employee_id)
);

ALTER TABLE public.schedule_template_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated read schedule_template_assignments" ON public.schedule_template_assignments;
CREATE POLICY "Allow all authenticated read schedule_template_assignments" ON public.schedule_template_assignments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all authenticated insert schedule_template_assignments" ON public.schedule_template_assignments;
CREATE POLICY "Allow all authenticated insert schedule_template_assignments" ON public.schedule_template_assignments
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated delete schedule_template_assignments" ON public.schedule_template_assignments;
CREATE POLICY "Allow all authenticated delete schedule_template_assignments" ON public.schedule_template_assignments
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sta_template_id ON public.schedule_template_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_sta_employee_id ON public.schedule_template_assignments(employee_id);
