create or replace function public.create_announcement_notifications(
  p_announcement_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  created_count integer := 0;
begin
  if not exists (
    select 1
    from user_role_assignments ura
    join app_roles ar on ar.id = ura.role_id
    where ura.user_id = auth.uid()::text
      and ar.name not in ('Employee', 'Staff')
      and (
        ar.is_admin
        or ar.allowed_modules @> array['announcements']::text[]
        or ar.allowed_modules @> array['*']::text[]
      )
  ) then
    raise exception 'Not authorized to notify employees about announcements';
  end if;

  insert into notifications (title, message, type, source, entity_id, recipient_user_id)
  select p_title, p_message, p_type, 'announcements', p_announcement_id, ura.user_id
  from user_role_assignments ura
  where ura.user_id is not null
    and ura.user_id <> auth.uid()::text;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

grant execute on function public.create_announcement_notifications(uuid, text, text, text) to authenticated;
