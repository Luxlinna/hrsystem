-- =========================================================================
-- Fix Positions RLS Policies
-- Allow public, anon, and authenticated roles to perform full CRUD on positions
-- =========================================================================

-- Drop restrictive policies if they exist
drop policy if exists "Allow all authenticated users to view positions" on positions;
drop policy if exists "Allow authenticated users to insert positions" on positions;
drop policy if exists "Allow authenticated users to update positions" on positions;
drop policy if exists "Allow authenticated users to delete positions" on positions;
drop policy if exists "Allow all users to view positions" on positions;
drop policy if exists "Allow all users to insert positions" on positions;
drop policy if exists "Allow all users to update positions" on positions;
drop policy if exists "Allow all users to delete positions" on positions;

-- Create open RLS policies for public/anon/authenticated
create policy "Allow all users to view positions"
  on positions for select
  using (deleted_at is null);

create policy "Allow all users to insert positions"
  on positions for insert
  with check (true);

create policy "Allow all users to update positions"
  on positions for update
  using (true)
  with check (true);

create policy "Allow all users to delete positions"
  on positions for delete
  using (true);

-- Grant table permissions
grant all on table positions to anon, authenticated, service_role;
