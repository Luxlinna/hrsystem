-- Migration: Seed default employee levels (Intern → Executive)
-- These are the BU-wide default levels visible on the BU page and Employee Directory filter.
-- Levels are global (branch_id IS NULL), so all BUs share them unless a BU overrides with
-- branch-specific entries.

INSERT INTO public.employee_levels (name, remark, status, sort_order)
VALUES
  ('Intern',    'Entry-level internship position',               'active', 1),
  ('Junior',    'Early-career employee with 0–2 years exp.',     'active', 2),
  ('Mid-level', 'Employee with 2–5 years relevant experience.',  'active', 3),
  ('Senior',    'Experienced employee with 5+ years.',           'active', 4),
  ('Lead',      'Technical or functional team lead.',            'active', 5),
  ('Manager',   'Department or team manager.',                   'active', 6),
  ('Director',  'Director-level leadership role.',               'active', 7),
  ('Executive', 'C-suite or executive leadership.',              'active', 8)
ON CONFLICT DO NOTHING;
