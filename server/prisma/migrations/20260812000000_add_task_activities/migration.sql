-- Task activity log: a chronological trail of everything that happens to a
-- task — creation, status changes, reassignments, and field edits — recorded
-- with the acting employee and a timestamp. Logging lives in a trigger so
-- every update path (board dropdown, edit modal, other clients) is captured
-- consistently, not just the places the UI happens to call.

create table if not exists task_activities (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid references employees(id) on delete set null,
  action text not null check (action in ('created', 'status_changed', 'assigned', 'updated')),
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists task_activities_task_id_idx on task_activities(task_id, created_at desc);

alter table task_activities enable row level security;
drop policy if exists "authenticated_read_task_activities" on task_activities;
create policy "authenticated_read_task_activities" on task_activities
  for select to authenticated using (true);
drop policy if exists "authenticated_insert_task_activities" on task_activities;
create policy "authenticated_insert_task_activities" on task_activities
  for insert to authenticated with check (true);

-- Resolve the acting employee from the JWT email — the same mapping the
-- app uses everywhere else (employees.email matches the auth account email).
create or replace function tasks_log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_old_assignee text;
  v_new_assignee text;
begin
  select id into v_actor
  from employees
  where email = auth.jwt() ->> 'email'
  limit 1;

  if tg_op = 'INSERT' then
    insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, v_actor, 'created', 'task', null, new.title);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'status_changed', 'status', old.status, new.status);
    end if;

    if new.assigned_to is distinct from old.assigned_to then
      select first_name || ' ' || last_name into v_old_assignee from employees where id = old.assigned_to;
      select first_name || ' ' || last_name into v_new_assignee from employees where id = new.assigned_to;
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'assigned', 'assigned_to', v_old_assignee, v_new_assignee);
    end if;

    if new.title is distinct from old.title then
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'updated', 'title', old.title, new.title);
    end if;

    if new.priority is distinct from old.priority then
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'updated', 'priority', old.priority, new.priority);
    end if;

    if new.due_date is distinct from old.due_date then
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'updated', 'due_date', old.due_date::text, new.due_date::text);
    end if;

    if new.description is distinct from old.description then
      insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, v_actor, 'updated', 'description', old.description, new.description);
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_task_activity on tasks;
create trigger trg_task_activity
after insert or update on tasks
for each row execute function tasks_log_activity();

-- Backfill a 'created' entry for tasks that already exist so their
-- activity feed isn't empty after this migration ships.
insert into task_activities (task_id, actor_id, action, field, old_value, new_value)
select id, assigned_by, 'created', 'task', null, title
from tasks t
where not exists (select 1 from task_activities a where a.task_id = t.id);
