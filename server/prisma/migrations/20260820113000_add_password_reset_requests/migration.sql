create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  acted_at timestamptz,
  acted_by uuid references auth.users(id) on delete set null,
  admin_note text,
  reset_link_sent_at timestamptz
);

create index if not exists password_reset_requests_status_idx
  on public.password_reset_requests(status);

create index if not exists password_reset_requests_email_idx
  on public.password_reset_requests(email);

alter table public.password_reset_requests enable row level security;

drop policy if exists "admins can read password reset requests" on public.password_reset_requests;
create policy "admins can read password reset requests"
  on public.password_reset_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
        and ura.deleted_at is null
        and (ar.is_admin = true or ar.allowed_modules @> array['*']::text[] or ar.allowed_modules @> array['settings']::text[])
    )
  );

alter table notifications drop constraint if exists notifications_source_check;
alter table notifications add constraint notifications_source_check
  check (source in (
    'hire','leave','payroll','branches','system','employees','onboarding','offboard','finance',
    'it_management','benefits','training','tools','announcements','meeting_rooms','meeting-rooms',
    'password_reset'
  ));

do $$
begin
  alter publication supabase_realtime add table password_reset_requests;
exception
  when duplicate_object then null;
end $$;
