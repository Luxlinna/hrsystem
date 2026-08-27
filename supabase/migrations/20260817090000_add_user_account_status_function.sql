-- Function to get account status for a list of emails
-- invited = row exists in user_role_assignments (invited or pending)
-- has_account = auth user has been created (user_id is linked)
create or replace function get_user_account_status(emails text[])
returns table (
  email text,
  invited boolean,
  has_account boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ura.email,
    true as invited,
    (ura.user_id is not null) as has_account
  from user_role_assignments ura
  where ura.email = any(emails);
end;
$$;

grant execute on function get_user_account_status(text[]) to authenticated;