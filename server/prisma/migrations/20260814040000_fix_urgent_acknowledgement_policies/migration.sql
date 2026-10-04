drop policy if exists "announcement_acknowledgements_own_select" on announcement_acknowledgements;
create policy "announcement_acknowledgements_own_select"
  on announcement_acknowledgements for select to authenticated
  using (user_id = auth.uid()::text or public.is_super_admin());

drop policy if exists "announcement_acknowledgements_own_insert" on announcement_acknowledgements;
create policy "announcement_acknowledgements_own_insert"
  on announcement_acknowledgements for insert to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists "announcement_acknowledgements_own_update" on announcement_acknowledgements;
create policy "announcement_acknowledgements_own_update"
  on announcement_acknowledgements for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
