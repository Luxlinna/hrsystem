alter table notifications add column if not exists recipient_user_id text;

create index if not exists notifications_recipient_user_id_idx
  on notifications (recipient_user_id);
