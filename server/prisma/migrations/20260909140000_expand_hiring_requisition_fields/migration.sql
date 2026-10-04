-- Expand hiring_requests with all 17 standard requisition record fields
-- 1. Add new columns
alter table hiring_requests
  add column if not exists requisition_id text unique,
  add column if not exists company text,
  add column if not exists business_unit text,
  add column if not exists division text,
  add column if not exists position_type text default 'new' check (position_type in ('new', 'replacement')),
  add column if not exists replacement_for_id uuid references employees(id) on delete set null,
  add column if not exists replacement_for_name text,
  add column if not exists location text,
  add column if not exists target_joining_date date,
  add column if not exists job_description text,
  add column if not exists hiring_manager_id uuid references employees(id) on delete set null,
  add column if not exists hiring_manager_name text;

-- 2. Create sequence and trigger for auto-generated Requisition ID (e.g. REQ-2026-0001)
create sequence if not exists hiring_request_seq;

create or replace function generate_hiring_requisition_id()
returns trigger as $$
declare
  next_val int;
  yr text;
begin
  if new.requisition_id is null or new.requisition_id = '' then
    select nextval('hiring_request_seq') into next_val;
    yr := to_char(coalesce(new.created_at, now()), 'YYYY');
    new.requisition_id := 'REQ-' || yr || '-' || lpad(next_val::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_hiring_requisition_id on hiring_requests;
create trigger trg_generate_hiring_requisition_id
before insert on hiring_requests
for each row
execute function generate_hiring_requisition_id();

-- 3. Backfill existing records with sequential requisition_id if null
do $$
declare
  r record;
  seq_counter int := 1;
  yr text;
begin
  for r in select id, created_at from hiring_requests where requisition_id is null order by created_at asc loop
    yr := to_char(coalesce(r.created_at, now()), 'YYYY');
    update hiring_requests
    set requisition_id = 'REQ-' || yr || '-' || lpad(seq_counter::text, 4, '0')
    where id = r.id;
    seq_counter := seq_counter + 1;
  end loop;
  
  -- sync sequence to the highest number
  perform setval('hiring_request_seq', greatest(seq_counter, 1));
end $$;

create index if not exists idx_hiring_requests_requisition_id on hiring_requests(requisition_id);
create index if not exists idx_hiring_requests_position_type on hiring_requests(position_type);
