-- Avatar uploads for the new "My Profile" page. The "avatars" storage
-- bucket itself is created via the Storage API (not plain SQL), so this
-- migration only adds the RLS policies on storage.objects: anyone can view
-- an avatar (they're public profile pictures), but a user may only
-- upload/replace/delete files under their own `{auth.uid()}/...` path.

create policy "avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "avatars_own_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_update"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
