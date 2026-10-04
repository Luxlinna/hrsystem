create table if not exists public.email_otps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  email      text not null,
  otp_hash   text not null,
  attempts   int not null default 0,
  verified   boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_email_otps_email on public.email_otps(email);
create index idx_email_otps_expires on public.email_otps(expires_at);

alter table public.email_otps enable row level security;

create policy "Service role full access on email_otps"
  on public.email_otps
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Auto-cleanup: delete expired OTPs older than 1 hour
create or replace function public.cleanup_expired_otps()
returns void
language sql
security definer
as $$
  delete from public.email_otps
  where expires_at < now() - interval '1 hour';
$$;
