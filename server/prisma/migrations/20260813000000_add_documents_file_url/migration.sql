-- Add file_url to the documents table so uploaded files can be downloaded.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url text;

-- Create a Supabase Storage bucket for document files.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents_public_read"
on storage.objects for select
to public
using (bucket_id = 'documents');

create policy "documents_authenticated_write"
on storage.objects for all
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');
