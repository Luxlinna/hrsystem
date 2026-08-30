import { supabase } from "./supabase";
import { uploadMediaToS3 } from "./s3-storage";

// Uploads photos and media directly to AWS S3 with automatic Supabase Storage fallback.
// Returns the public accessible URL (https://hrsystem-ops.s3.us-east-1.amazonaws.com/...).
export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  try {
    const s3Item = await uploadMediaToS3(file, bucket);
    if (s3Item?.url) {
      return s3Item.url;
    }
  } catch (s3Err) {
    console.warn("AWS S3 upload failed, falling back to Supabase Storage:", s3Err);
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
