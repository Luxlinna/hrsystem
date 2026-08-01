-- The self-service Clock In "late" calculation was hardcoded to a 9:00 AM
-- start time, which doesn't match this company's actual 8:00 AM policy.
-- Make it a real system setting instead, editable from Settings > General.

insert into system_settings (key, value, type) values
  ('work_start_time', '08:00', 'text')
on conflict (key) do nothing;
