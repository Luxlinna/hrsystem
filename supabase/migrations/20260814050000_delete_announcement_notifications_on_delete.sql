create or replace function public.delete_announcement_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from notifications
  where source = 'announcements'
    and entity_id = old.id;

  return old;
end;
$$;

drop trigger if exists delete_announcement_notifications_after_delete on announcements;
create trigger delete_announcement_notifications_after_delete
  after delete on announcements
  for each row
  execute function public.delete_announcement_notifications();
