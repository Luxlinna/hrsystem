-- Resync hiring_request_seq to max requisition_id and improve trigger robustness
do $$
declare
  max_num int := 0;
  r record;
  num_val int;
begin
  for r in select requisition_id from hiring_requests where requisition_id ~ '^REQ-[0-9]{4}-[0-9]+$' loop
    num_val := split_part(r.requisition_id, '-', 3)::int;
    if num_val > max_num then
      max_num := num_val;
    end if;
  end loop;

  if max_num > 0 then
    perform setval('hiring_request_seq', max_num);
  end if;
end $$;

-- Update trigger function to never collide even if sequence slips
create or replace function generate_hiring_requisition_id()
returns trigger as $$
declare
  next_val int;
  yr text;
  candidate_id text;
  exists_count int;
begin
  if new.requisition_id is null or new.requisition_id = '' then
    yr := to_char(coalesce(new.created_at, now()), 'YYYY');
    loop
      select nextval('hiring_request_seq') into next_val;
      candidate_id := 'REQ-' || yr || '-' || lpad(next_val::text, 4, '0');
      select count(*) into exists_count from hiring_requests where requisition_id = candidate_id;
      if exists_count = 0 then
        new.requisition_id := candidate_id;
        exit;
      end if;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql;
