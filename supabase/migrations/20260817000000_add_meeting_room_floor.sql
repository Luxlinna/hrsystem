-- Add floor column to meeting_rooms and update existing rooms
alter table meeting_rooms
  add column if not exists floor integer not null default 3;

-- Update floors for standard rooms
update meeting_rooms set floor = 3 where name in ('Small Meeting Room', 'Training Room');
update meeting_rooms set floor = 5 where name in ('VIP Room', 'Big Meeting Room');

-- Ensure Training Room exists on Floor 3
insert into meeting_rooms (name, capacity, color, floor)
select 'Training Room', 30, '#059669', 3
where not exists (select 1 from meeting_rooms where name = 'Training Room');

-- Ensure VIP Room exists on Floor 5
update meeting_rooms set name = 'VIP Room', floor = 5 where name = 'Big Meeting Room';
