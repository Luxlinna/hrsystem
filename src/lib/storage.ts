import { supabase } from "./supabase";

// Uploads to a public Supabase Storage bucket under the caller's existing
// (already-authenticated) Supabase session and returns the public URL.
// `path` is the object path within the bucket, not including the bucket name.
export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
