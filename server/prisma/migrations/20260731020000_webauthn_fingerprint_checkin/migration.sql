-- Lets staff register their phone/laptop fingerprint (via the browser's
-- WebAuthn platform authenticator) and requires it, together with the
-- existing geofence check, to clock in.
--
-- Actual signature verification happens server-side in the
-- webauthn-register / webauthn-authenticate edge functions using the
-- service role key. These tables are never written to directly by the
-- client — only read, so the UI can show "device registered" state and
-- let a user remove their own device. If we allowed client-side inserts,
-- anyone could register a credential under someone else's employee_id and
-- clock in as them.

create table if not exists webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  challenge text not null,
  purpose text not null check (purpose in ('register', 'authenticate')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table webauthn_credentials enable row level security;
alter table webauthn_challenges enable row level security;

create policy "webauthn_credentials_select_own" on webauthn_credentials
  for select to authenticated
  using (employee_id in (select id from employees where email = auth.jwt() ->> 'email'));

-- No policies granted to `authenticated` on webauthn_challenges — only the
-- service role (used by the edge functions) can read/write it.

create or replace function public.delete_my_webauthn_credential(cred_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from webauthn_credentials
  where id = cred_id
    and employee_id in (select id from employees where email = auth.jwt() ->> 'email');
end;
$$;

grant execute on function public.delete_my_webauthn_credential(uuid) to authenticated;
