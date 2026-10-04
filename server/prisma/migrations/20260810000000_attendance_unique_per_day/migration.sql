-- attendance_records had only a non-unique index on (employee_id, date),
-- so a double-tap on "Clock In", or the geofence auto check-in prompt
-- racing a manual tap, could insert two rows for the same employee/day —
-- corrupting attendance totals and history. Enforce one row per
-- employee per day, and let the app upsert (clock-in overwrites an
-- existing row for today, e.g. one an admin pre-created as "absent")
-- instead of racing a plain insert.

-- Collapse any duplicates that already exist from that race before the
-- constraint can be added — keep the most complete row per employee/day
-- (has clock_out, then has clock_in, then most recent), drop the rest.
with ranked as (
  select id,
    row_number() over (
      partition by employee_id, date
      order by (clock_out is not null) desc, (clock_in is not null) desc, created_at desc
    ) as rn
  from attendance_records
)
delete from attendance_records
where id in (select id from ranked where rn > 1);

alter table attendance_records
  add constraint attendance_records_employee_date_unique unique (employee_id, date);
