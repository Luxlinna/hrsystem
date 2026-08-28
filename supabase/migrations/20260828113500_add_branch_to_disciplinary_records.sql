-- Add branch_id to disciplinary_records table
alter table disciplinary_records add column if not exists branch_id uuid references branches(id) on delete set null;

create index if not exists idx_disciplinary_records_branch_id on disciplinary_records(branch_id);

-- Backfill branch_id from employees for existing records
update disciplinary_records d
set branch_id = e.branch_id
from employees e
where d.employee_id = e.id and d.branch_id is null and e.branch_id is not null;
