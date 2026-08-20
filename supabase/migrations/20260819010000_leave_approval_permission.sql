-- Fixes: a plain "Employee" role could approve/reject other people's leave.
--
-- Two separate defects produced that:
--
-- 1. /leave derived its manage rights purely from the two *visibility* flags
--    (leave_view_all_employees / leave_view_own_branch), so any role allowed
--    to SEE the team's leave automatically got Approve/Reject buttons too.
--    Viewing a team calendar and deciding a request are different jobs.
--
-- 2. leave_requests still carried the blanket "authenticated_full_access"
--    RLS policy from the initial schema, so the UI check was cosmetic: any
--    signed-in user could approve any request by calling the API directly.
--
-- This adds an explicit approve capability (mirroring the existing
-- meeting_rooms_approve flag) and enforces it in the database, so revoking it
-- in the Admin Portal actually takes effect instead of only hiding buttons.

alter table app_roles add column if not exists leave_approve boolean not null default false;

-- Roles whose actual job is reviewing leave keep the capability. Everyone
-- else (including any role that merely has leave visibility) starts with it
-- off and must be granted it explicitly in the Admin Portal.
update app_roles
set leave_approve = true
where is_admin = true
   or allowed_modules @> '{"*"}'
   or name in ('Super Admin', 'HR Manager', 'Branch Manager', 'Department Manager', 'HR Staff', 'CEO');

-- The self-cancel flow in the UI tries status='cancelled' first and only falls
-- back to 'rejected' because the original check constraint refused it. Allow
-- the honest value so a withdrawn request is no longer recorded as a rejection.
alter table leave_requests drop constraint if exists leave_requests_status_check;
alter table leave_requests add constraint leave_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled'));

-- Does the calling user's role permit deciding leave requests?
create or replace function public.can_approve_leave()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select ar.is_admin or ar.allowed_modules @> '{"*"}' or ar.leave_approve
      from user_role_assignments ura
      join app_roles ar on ar.id = ura.role_id
      where ura.user_id = auth.uid()
      limit 1
    ),
    false
  );
$$;

-- The employee row belonging to the calling user, used to tell "cancelling my
-- own request" apart from "rejecting someone else's".
create or replace function public.my_employee_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from employees
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

create or replace function public.enforce_leave_approval_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT = service_role / trusted backend context, which already bypasses
  -- RLS entirely. Don't second-guess it here.
  if auth.uid() is null then
    return new;
  end if;

  if new.status is distinct from old.status then
    -- Nobody approves without the capability — including approving your own.
    if new.status = 'approved' and not public.can_approve_leave() then
      raise exception 'Your role is not permitted to approve leave requests'
        using errcode = '42501';
    end if;

    -- Rejecting/cancelling someone else's request is an approver action;
    -- withdrawing your own pending request is not.
    if new.status in ('rejected', 'cancelled')
       and not public.can_approve_leave()
       and new.employee_id is distinct from public.my_employee_id() then
      raise exception 'Your role is not permitted to reject leave requests'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_leave_approval on leave_requests;
create trigger trg_enforce_leave_approval
before update on leave_requests
for each row
execute function public.enforce_leave_approval_permission();

grant execute on function public.can_approve_leave() to authenticated;
grant execute on function public.my_employee_id() to authenticated;
