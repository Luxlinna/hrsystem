-- Candidate resumes, onboarding documents, and HR-managed employee avatars
-- were uploaded straight to Firebase Storage from the client. This app never
-- authenticates with Firebase (only Supabase), so those uploads depended on
-- the Firebase bucket/rules being manually set up to allow unauthenticated
-- writes — which was never done, and failed with a CORS/permission error on
-- every attempt. Move all of it onto Supabase Storage, which every request
-- already carries the user's real Supabase session for.
--
-- Buckets are public-read (same as the existing "avatars" bucket): every
-- page that renders these files does so with a plain URL in an <img>,
-- <object>, <iframe>, or <a href>, and access to the pages themselves is
-- already gated by the app's own module/permission system. Write access
-- follows this codebase's existing "authenticated_full_access" convention
-- (see the RLS section of the initial schema) rather than inventing a
-- stricter, inconsistent model just for storage.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('onboarding-documents', 'onboarding-documents', true)
on conflict (id) do nothing;

create policy "resumes_public_read"
on storage.objects for select
to public
using (bucket_id = 'resumes');

create policy "resumes_authenticated_write"
on storage.objects for all
to authenticated
using (bucket_id = 'resumes')
with check (bucket_id = 'resumes');

create policy "onboarding_documents_public_read"
on storage.objects for select
to public
using (bucket_id = 'onboarding-documents');

create policy "onboarding_documents_authenticated_write"
on storage.objects for all
to authenticated
using (bucket_id = 'onboarding-documents')
with check (bucket_id = 'onboarding-documents');

-- The existing "avatars" bucket policies only let a user write under their
-- own `{auth.uid()}/...` folder (self-service "My Profile" photo). The
-- Employee Profile page also lets HR (employees_manage / is_admin) set any
-- employee's avatar under an `employees/...` prefix — add write access for
-- that path without touching the existing self-service policies.
create policy "avatars_hr_managed_write"
on storage.objects for all
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'employees')
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'employees');
