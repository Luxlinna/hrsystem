-- Per-branch check-in/check-out schedule, so each branch can control its own
-- "late" and "early leave" thresholds instead of one company-wide time.
-- Nullable/optional, same pattern as the branch geofence columns: leave blank
-- to fall back to the company default (Settings > Work Start Time) for start,
-- or to skip early-leave detection entirely for end.
alter table branches add column if not exists work_start_time time;
alter table branches add column if not exists work_end_time time;

-- Mirrors late_minutes, tracked symmetrically for early clock-outs.
alter table attendance_records add column if not exists early_leave_minutes int not null default 0;
