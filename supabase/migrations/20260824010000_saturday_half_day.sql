-- Saturday is a half working day (08:00–12:00): restore day 6 in working_days.
-- Branch-level hour overrides now skip Saturdays, so saturday_end_time applies.
update system_settings set value = '[1,2,3,4,5,6]'
where key = 'working_days' and value <> '[1,2,3,4,5,6]';
