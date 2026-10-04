-- Meeting room booking: two physical rooms (one small, one big), with a
-- shared schedule so anyone can see who/which department has a room at a
-- given time, and book an open slot themselves.

create extension if not exists btree_gist;

create table if not exists meeting_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer,
  color text not null default '#0D7377',
  created_at timestamptz not null default now()
);

insert into meeting_rooms (name, capacity, color)
select 'Small Meeting Room', 6, '#0D7377'
where not exists (select 1 from meeting_rooms where name = 'Small Meeting Room');

insert into meeting_rooms (name, capacity, color)
select 'Big Meeting Room', 20, '#7C3AED'
where not exists (select 1 from meeting_rooms where name = 'Big Meeting Room');

create table if not exists room_bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references meeting_rooms(id) on delete cascade,
  title text not null,
  booked_by uuid not null references employees(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint room_bookings_time_valid check (end_time > start_time)
);

-- Belt-and-suspenders against double-booking a room for an overlapping
-- time window — enforced in the DB itself, not just in app code, so a race
-- between two people booking at once can't slip through.
alter table room_bookings drop constraint if exists room_bookings_no_overlap;
alter table room_bookings add constraint room_bookings_no_overlap
  exclude using gist (
    room_id with =,
    tsrange((date + start_time)::timestamp, (date + end_time)::timestamp) with &&
  );

alter table meeting_rooms enable row level security;
alter table room_bookings enable row level security;

drop policy if exists "meeting_rooms_select" on meeting_rooms;
create policy "meeting_rooms_select" on meeting_rooms for select to authenticated using (true);

drop policy if exists "room_bookings_select" on room_bookings;
create policy "room_bookings_select" on room_bookings for select to authenticated using (true);

drop policy if exists "room_bookings_insert" on room_bookings;
create policy "room_bookings_insert" on room_bookings for insert to authenticated with check (
  booked_by in (select id from employees where email = auth.jwt() ->> 'email')
);

drop policy if exists "room_bookings_delete_own_or_admin" on room_bookings;
create policy "room_bookings_delete_own_or_admin" on room_bookings for delete to authenticated using (
  booked_by in (select id from employees where email = auth.jwt() ->> 'email')
  or public.is_super_admin()
);

-- Give every non-admin role access to the new module (Super Admin already
-- has "*", and admin roles bypass module checks entirely).
update app_roles
set allowed_modules = allowed_modules || '{meeting-rooms}'::text[]
where not (allowed_modules @> '{meeting-rooms}'::text[])
  and not (allowed_modules @> '{"*"}'::text[]);
