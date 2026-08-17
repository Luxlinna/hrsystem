create table if not exists announcement_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  user_id text not null,
  accepted_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);

create index if not exists announcement_acknowledgements_user_id_idx
  on announcement_acknowledgements (user_id);

alter table announcement_acknowledgements enable row level security;

drop policy if exists "announcement_acknowledgements_own_select" on announcement_acknowledgements;
create policy "announcement_acknowledgements_own_select"
  on announcement_acknowledgements for select to authenticated
  using (user_id = auth.uid()::text or public.is_super_admin());

drop policy if exists "announcement_acknowledgements_own_insert" on announcement_acknowledgements;
create policy "announcement_acknowledgements_own_insert"
  on announcement_acknowledgements for insert to authenticated
  with check (user_id = auth.uid()::text);
