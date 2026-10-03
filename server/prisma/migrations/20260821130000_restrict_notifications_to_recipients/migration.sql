-- Restrict notification visibility to intended recipients.
--
-- Bug: password reset request notifications are addressed to admins via
-- recipient_user_id, but the notifications table still uses the blanket
-- "authenticated_full_access" policy from the initial schema
-- (USING (true) WITH CHECK (true)). Any authenticated user could read,
-- update, or delete every notification row directly via the API, and
-- Realtime postgres_changes delivered admin-only notifications (e.g.
-- source = 'password_reset') to every connected client.
--
-- The UI filtered rows client-side (.or(recipient_user_id.is.null,...)),
-- but that is not enforcement. This migration makes the database enforce
-- recipient scoping:
--   - select/update: only the recipient, or broadcast rows (recipient null)
--   - insert: stays open to authenticated users (client-side notify()
--     legitimately targets other users, e.g. leave approvers); edge
--     functions use the service role key which bypasses RLS anyway
--   - delete: own/broadcast rows, plus Super Admins (announcement cleanup)

drop policy if exists "authenticated_full_access" on notifications;

create policy "notifications_select_own_or_broadcast"
  on notifications for select
  to authenticated
  using (
    recipient_user_id is null
    or recipient_user_id = auth.uid()::text
  );

create policy "notifications_insert_authenticated"
  on notifications for insert
  to authenticated
  with check (true);

create policy "notifications_update_own_or_broadcast"
  on notifications for update
  to authenticated
  using (
    recipient_user_id is null
    or recipient_user_id = auth.uid()::text
  )
  with check (
    recipient_user_id is null
    or recipient_user_id = auth.uid()::text
  );

create policy "notifications_delete_own_broadcast_or_admin"
  on notifications for delete
  to authenticated
  using (
    recipient_user_id is null
    or recipient_user_id = auth.uid()::text
    or public.is_super_admin()
  );
