-- Allow authenticated users to manage meeting rooms
alter table meeting_rooms enable row level security;

drop policy if exists "meeting_rooms_select" on meeting_rooms;
create policy "meeting_rooms_select" on meeting_rooms for select to authenticated using (true);

drop policy if exists "meeting_rooms_insert" on meeting_rooms;
create policy "meeting_rooms_insert" on meeting_rooms for insert to authenticated with check (
  true
);

drop policy if exists "meeting_rooms_update" on meeting_rooms;
create policy "meeting_rooms_update" on meeting_rooms for update to authenticated using (
  true
);

drop policy if exists "meeting_rooms_delete" on meeting_rooms;
create policy "meeting_rooms_delete" on meeting_rooms for delete to authenticated using (
  true
);
