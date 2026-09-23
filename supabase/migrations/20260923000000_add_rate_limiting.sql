-- Rate Limiting Table and Atomic Rate Limit Check Function
-- Protects Supabase Edge Functions and API endpoints against spam, DoS, and brute-force attacks.

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

-- Optimize queries for key and time windows
create index if not exists idx_rate_limits_key_created on public.rate_limits (key, created_at desc);

-- Restrict direct access to service role only
alter table public.rate_limits enable row level security;

create policy "Service role full access on rate_limits"
  on public.rate_limits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Atomic check-and-record function
create or replace function public.check_rate_limit(
  p_key text,
  p_max_requests int,
  p_window_seconds int
)
returns table(allowed boolean, current_count int, retry_after_seconds int)
language plpgsql
security definer
as $$
declare
  v_count int;
  v_oldest timestamptz;
  v_window_start timestamptz := now() - (p_window_seconds || ' seconds')::interval;
begin
  -- Prune entries older than 2x the window to maintain high performance
  delete from public.rate_limits
  where key = p_key and created_at < (now() - ((p_window_seconds * 2) || ' seconds')::interval);

  -- Count recent requests within the window
  select count(*), min(created_at)
  into v_count, v_oldest
  from public.rate_limits
  where key = p_key and created_at >= v_window_start;

  -- If limit reached or exceeded, return not allowed and time to wait
  if v_count >= p_max_requests then
    return query select 
      false, 
      v_count, 
      greatest(1, ceil(extract(epoch from (v_oldest + (p_window_seconds || ' seconds')::interval - now())))::int);
    return;
  end if;

  -- Under limit: record request and allow
  insert into public.rate_limits (key) values (p_key);

  return query select true, v_count + 1, 0;
end;
$$;

-- Periodic cleanup helper for background cron if desired
create or replace function public.cleanup_stale_rate_limits()
returns void
language sql
security definer
as $$
  delete from public.rate_limits
  where created_at < now() - interval '24 hours';
$$;
