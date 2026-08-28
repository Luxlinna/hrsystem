-- Add branch_id to it_tickets table
alter table it_tickets add column if not exists branch_id uuid references branches(id) on delete set null;

create index if not exists idx_it_tickets_branch_id on it_tickets(branch_id);
