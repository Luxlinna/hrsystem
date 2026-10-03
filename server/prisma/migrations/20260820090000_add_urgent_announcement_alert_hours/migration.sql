alter table announcements
  add column if not exists urgent_alert_hours int not null default 24;

alter table announcements
  drop constraint if exists announcements_urgent_alert_hours_check;

alter table announcements
  add constraint announcements_urgent_alert_hours_check
  check (urgent_alert_hours between 1 and 168);
