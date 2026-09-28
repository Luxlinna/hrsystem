-- Add DELETE policy on hiring_requests for authenticated users so hard deletion also works
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'hiring_requests' and policyname = 'Allow delete hiring_requests for authenticated users'
  ) then
    create policy "Allow delete hiring_requests for authenticated users"
      on hiring_requests for delete
      to authenticated
      using (true);
  end if;
end $$;
