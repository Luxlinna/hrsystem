-- =========================================================================
-- Positions Table & Migration
-- Supports Position/Designation management with Tax Position, Status, and Branch scoping.
-- =========================================================================

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  tax_position text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_positions_branch_id on positions(branch_id);
create index if not exists idx_positions_status on positions(status);
create index if not exists idx_positions_sort_order on positions(sort_order);

-- Enable RLS
alter table positions enable row level security;

-- RLS Policies
create policy "Allow all authenticated users to view positions"
  on positions for select
  to authenticated
  using (deleted_at is null);

create policy "Allow authenticated users to insert positions"
  on positions for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update positions"
  on positions for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete positions"
  on positions for delete
  to authenticated
  using (true);

-- Seed initial positions if table is empty
do $$
begin
  if not exists (select 1 from positions limit 1) then
    insert into positions (name, sort_order, status) values
      ('ACM Grocery II', 1, 'active'),
      ('ACM-SF & Butchery', 2, 'active'),
      ('AP - Non Trade', 3, 'active'),
      ('Account Payable Executive', 4, 'active'),
      ('Account Payable Officer', 5, 'active'),
      ('Account Payable Supervisor', 6, 'active'),
      ('Account Receivable Executive', 7, 'active'),
      ('Account Receivable Officer', 8, 'active'),
      ('Accounting Assistant', 9, 'active'),
      ('Accounting Intern', 10, 'active'),
      ('Accounting Manager', 11, 'active'),
      ('Accounting Supervisor', 12, 'active'),
      ('Acting Assistant Store Manager', 13, 'active');
  end if;
end $$;
