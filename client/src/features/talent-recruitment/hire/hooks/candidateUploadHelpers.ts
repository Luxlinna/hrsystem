import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import type { CandidateDocument } from "../types";

/**
 * Upload candidate documents strictly to AWS S3.
 * Supabase Storage has been eliminated to ensure files reside exclusively on AWS S3.
 */
export async function uploadCandidateFiles(filesList: File[]): Promise<CandidateDocument[]> {
  if (filesList.length === 0) return [];

  const s3Items = await uploadMultipleFilesToS3(filesList, "candidates/documents");
  return s3Items.map((item) => ({
    name: item.name,
    url: item.url,
    size: item.size,
    type: item.type,
    uploaded_at: new Date().toISOString(),
  }));
}

