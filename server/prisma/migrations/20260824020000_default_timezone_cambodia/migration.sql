-- Company runs on Cambodia time (ICT, UTC+7). The timezone setting drives
-- all clock in/out recording and "today" logic, independent of device clocks.
insert into system_settings (key, value, type) values
  ('timezone', 'Asia/Phnom_Penh', 'text')
on conflict (key) do update set value = excluded.value;
