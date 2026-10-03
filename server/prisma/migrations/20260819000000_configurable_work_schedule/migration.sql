insert into system_settings (key, value, type) values
  ('work_start_time', '08:00', 'text'), ('work_end_time', '17:00', 'text'),
  ('working_days', '[1,2,3,4,5,6]', 'text'), ('saturday_start_time', '08:00', 'text'),
  ('saturday_end_time', '12:00', 'text'), ('late_grace_minutes', '15', 'number'),
  ('early_leave_grace_minutes', '15', 'number'), ('checkout_reminder_minutes', '15', 'number')
on conflict (key) do nothing;
