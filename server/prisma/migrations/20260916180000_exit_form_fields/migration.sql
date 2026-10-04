-- =========================================================================
-- Employee Exit Form Enhancement Fields
-- Adds blacklist, remark, contracts, and severance pay information
-- =========================================================================

alter table employee_exits
  add column if not exists is_blacklisted boolean default false,
  add column if not exists remark text,
  add column if not exists contract_type text,
  add column if not exists severance_pay_info jsonb default '{}'::jsonb,
  add column if not exists severance_amount numeric default 0;

-- Optional index on blacklisted exits for quick audit
create index if not exists idx_employee_exits_blacklisted on employee_exits(is_blacklisted) where is_blacklisted = true;
