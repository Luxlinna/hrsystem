delete from announcement_acknowledgements a
using announcement_acknowledgements b
where a.announcement_id = b.announcement_id
  and a.user_id = b.user_id
  and a.id > b.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'announcement_acknowledgements_announcement_id_user_id_key'
      and conrelid = 'announcement_acknowledgements'::regclass
  ) then
    alter table announcement_acknowledgements
      add constraint announcement_acknowledgements_announcement_id_user_id_key
      unique (announcement_id, user_id);
  end if;
end;
$$;
