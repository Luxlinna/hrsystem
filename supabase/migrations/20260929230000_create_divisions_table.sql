-- =========================================================================
-- Divisions Table & Migration
-- Supports executive division management with Head of Division, Status,
-- and Branch scoping (Empty by default, no sort_order).
-- =========================================================================

create table if not exists divisions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  code text,
  head_of_division_id uuid references employees(id) on delete set null,
  head_of_division_name text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_divisions_branch_id on divisions(branch_id);
create index if not exists idx_divisions_status on divisions(status);

-- Enable RLS
alter table divisions enable row level security;

-- Drop all previous policies
drop policy if exists "divisions_select" on divisions;
drop policy if exists "divisions_insert" on divisions;
drop policy if exists "divisions_update" on divisions;
drop policy if exists "divisions_delete" on divisions;
drop policy if exists "Allow all authenticated users to view divisions" on divisions;
drop policy if exists "Allow anon to view divisions" on divisions;
drop policy if exists "Allow authenticated users to insert divisions" on divisions;
drop policy if exists "Allow authenticated users to update divisions" on divisions;
drop policy if exists "Allow authenticated users to delete divisions" on divisions;

-- Permissive RLS policies (allow full CRUD without silent drops)
create policy "divisions_select" on divisions for select using (true);
create policy "divisions_insert" on divisions for insert with check (true);
create policy "divisions_update" on divisions for update using (true) with check (true);
create policy "divisions_delete" on divisions for delete using (true);
