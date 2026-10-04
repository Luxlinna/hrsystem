-- Fix: the notifications table's RLS policies had drifted from migration
-- 20260821130000_restrict_notifications_to_recipients.sql — the live
-- database only had a single SELECT policy left ("users_read_own_notifications",
-- requiring recipient_user_id::uuid = auth.uid() with no broadcast/null
-- clause) and NO insert/update/delete policies at all. With RLS enabled and
-- no INSERT policy, every client-side notify() call (leave, meeting rooms,
-- announcements fallback, attendance) was silently failing to write —
-- confirmed via the notifications table showing zero rows for those sources
-- despite leave_requests/room_bookings being created successfully. Only
-- notifications created via a service-role Edge Function (e.g.
-- request-password-reset) still worked, since the service role bypasses RLS.
--
-- This restores the full policy set from 20260821130000 as a tracked
-- migration (drop-if-exists first so it's safe regardless of whatever
-- ad-hoc state the live policies are currently in).

drop policy if exists "users_read_own_notifications" on notifications;
drop policy if exists "authenticated_full_access" on notifications;
drop policy if exists "notifications_select_own_or_broadcast" on notifications;
drop policy if exists "notifications_insert_authenticated" on notifications;
drop policy if exists "notifications_update_own_or_broadcast" on notifications;
drop policy if exists "notifications_delete_own_broadcast_or_admin" on notifications;

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
