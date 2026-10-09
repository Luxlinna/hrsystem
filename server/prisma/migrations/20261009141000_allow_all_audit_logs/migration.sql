-- =========================================================================
-- Allow full access to audit_logs for movements and deletion
-- =========================================================================

alter table if exists audit_logs enable row level security;

drop policy if exists "Allow all on audit_logs" on audit_logs;
drop policy if exists "Allow delete on audit_logs" on audit_logs;

create policy "Allow all on audit_logs"
  on audit_logs
  for all
  using (true)
  with check (true);

grant all on table audit_logs to anon, authenticated, service_role;
