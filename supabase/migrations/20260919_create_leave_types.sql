-- Migration: Create custom leave types table for Leave Settings
CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  period_type text NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'hourly')),
  rate numeric NOT NULL DEFAULT 1.0,
  allow_compensatory boolean NOT NULL DEFAULT false,
  is_unpaid boolean NOT NULL DEFAULT false,
  eligible_for text NOT NULL DEFAULT 'both' CHECK (eligible_for IN ('both', 'male', 'female')),
  excluded_contract_types text[] NOT NULL DEFAULT '{}',
  request_in_advance boolean NOT NULL DEFAULT false,
  require_attachment boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_types_select" ON public.leave_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "leave_types_insert" ON public.leave_types
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "leave_types_update" ON public.leave_types
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "leave_types_delete" ON public.leave_types
  FOR DELETE TO authenticated USING (true);

-- Seed standard leave types
INSERT INTO public.leave_types (code, name, period_type, rate, allow_compensatory, is_unpaid, eligible_for, request_in_advance, require_attachment)
VALUES
  ('AL', 'Annual Leave (ការឈប់សម្រាកប្រចាំឆ្នាំ)', 'daily', 1.0, false, false, 'both', false, false),
  ('SL', 'Sick Leave (ការឈប់សម្រាកដោយជំងឺ)', 'daily', 1.0, false, false, 'both', false, true),
  ('UL', 'Unpaid Leave (ការឈប់សម្រាកគ្មានប្រាក់ឈ្នួល)', 'daily', 1.0, false, true, 'both', true, false),
  ('CL', 'Compensatory Leave (ផ្ទេរថ្ងៃបុណ្យ/ឈប់សម្រាក)', 'daily', 1.0, true, false, 'both', false, false),
  ('ML', 'Maternity Leave (ការឈប់សម្រាកលំហែមាតុភាព)', 'daily', 1.0, false, false, 'female', true, true),
  ('SP', 'Special Leave (ការឈប់សម្រាកពិសេសច្បាប់ការងារ)', 'daily', 1.0, false, false, 'both', false, true)
ON CONFLICT (code) DO NOTHING;
