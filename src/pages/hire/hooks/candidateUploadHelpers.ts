import { supabase } from "@/lib/supabase";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import type { CandidateDocument } from "../types";

export async function uploadCandidateFiles(filesList: File[]): Promise<CandidateDocument[]> {
  const newDocs: CandidateDocument[] = [];
  if (filesList.length === 0) return newDocs;

  try {
    const s3Items = await uploadMultipleFilesToS3(filesList, "candidates/documents");
    return s3Items.map((item) => ({
      name: item.name,
      url: item.url,
      size: item.size,
      type: item.type,
      uploaded_at: new Date().toISOString(),
    }));
  } catch (s3Err) {
    console.warn("AWS S3 upload failed, attempting Supabase storage fallback:", s3Err);
    for (const file of filesList) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `resumes/${Date.now()}_${cleanName}`;
        const { error: upErr } = await supabase.storage.from("candidates").upload(path, file, { upsert: true });
        if (!upErr) {
          const { data } = supabase.storage.from("candidates").getPublicUrl(path);
          newDocs.push({
            name: file.name,
            url: data.publicUrl,
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString(),
          });
        } else {
          newDocs.push({
            name: file.name,
            url: "",
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString(),
          });
        }
      } catch {
        newDocs.push({
          name: file.name,
          url: "",
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        });
      }
    }
  }
  return newDocs;
}
