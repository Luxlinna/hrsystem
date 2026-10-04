-- Mon–Fri schedule with an unpaid 12:00–13:00 lunch break.
-- Updates the existing working_days row (older installs seeded [1,2,3,4,5,6])
-- and seeds the break window used to deduct break time from worked hours.
update system_settings set value = '[1,2,3,4,5]'
where key = 'working_days' and value <> '[1,2,3,4,5]';

insert into system_settings (key, value, type) values
  ('break_start_time', '12:00', 'text'), ('break_end_time', '13:00', 'text')
on conflict (key) do nothing;
