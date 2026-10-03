-- Extend the tasks table with "outside work" check-in/out fields.
-- When a task is flagged is_outside_work, the assignee checks in (captures
-- location + photo) when arriving on site, and checks out (captures again)
-- when leaving.  Regular tasks leave all work_* columns NULL.

alter table tasks
  add column if not exists is_outside_work boolean not null default false,
  add column if not exists work_status text check (work_status in ('checked_in', 'checked_out')),
  add column if not exists work_checked_in_at timestamptz,
  add column if not exists work_checked_out_at timestamptz,
  add column if not exists work_lat numeric(9, 6),
  add column if not exists work_lng numeric(9, 6),
  add column if not exists work_accuracy_m integer,
  add column if not exists work_address text,
  add column if not exists work_image_url text,
  add column if not exists work_check_out_lat numeric(9, 6),
  add column if not exists work_check_out_lng numeric(9, 6),
  add column if not exists work_check_out_accuracy_m integer,
  add column if not exists work_check_out_address text,
  add column if not exists work_check_out_image_url text;

-- Public-read bucket for work-site proof photos.
insert into storage.buckets (id, name, public)
values ('outside-work-images', 'outside-work-images', true)
on conflict (id) do nothing;

drop policy if exists "outside_work_images_public_read" on storage.objects;
create policy "outside_work_images_public_read"
on storage.objects for select
using (bucket_id = 'outside-work-images');

drop policy if exists "outside_work_images_authenticated_write" on storage.objects;
create policy "outside_work_images_authenticated_write"
on storage.objects for all
to authenticated
using (bucket_id = 'outside-work-images')
with check (bucket_id = 'outside-work-images');
