import { uploadFileToS3 } from "./s3-storage";

/**
 * Uploads any document or media file directly to AWS S3.
 * Supabase Storage has been strictly disabled for files and documents
 * to guarantee all files are preserved in AWS S3.
 *
 * @param folder S3 folder/prefix (e.g. "documents", "onboarding-documents", "movements")
 * @param _path Legacy parameter retained for backward compatibility
 * @param file The File object to upload
 * @returns The public AWS S3 URL
 */
export async function uploadFile(folder: string, _path: string, file: File): Promise<string> {
  const targetFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "documents";
  const s3Item = await uploadFileToS3(file, targetFolder);
  return s3Item.url;
}

