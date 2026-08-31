import { supabase } from "./supabase";

const S3_PUBLIC_URL = import.meta.env.VITE_S3_PUBLIC_URL || "";
const FUNCTIONS_URL = `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1`;

export interface MediaItem {
  url: string;
  type: "image" | "video";
  name: string;
}

export interface S3FileItem {
  url: string;
  name: string;
  size: number;
  type: string;
  key: string;
}

async function getUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${FUNCTIONS_URL}/s3-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, contentType }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get upload URL");
  return data;
}

export async function deleteS3File(key: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${FUNCTIONS_URL}/s3-delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete file");
}

export function getS3PublicUrl(key: string): string {
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

export function getS3KeyFromUrl(url: string): string | null {
  if (!S3_PUBLIC_URL) return null;
  try {
    const prefix = S3_PUBLIC_URL.replace(/\/$/, "");
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length + 1);
  } catch {
    return null;
  }
}

/**
 * Upload a document or generic file to AWS S3.
 * Preserves original file extension and MIME type.
 */
export async function uploadFileToS3(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<S3FileItem> {
  const isImage = file.type.startsWith("image/");
  let uploadFile: File = file;
  if (isImage) {
    try {
      const compressedBlob = await compressImage(file);
      uploadFile = new File([compressedBlob], file.name, { type: file.type || "image/jpeg" });
    } catch {
      uploadFile = file;
    }
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${Date.now()}_${cleanName}`;

  onProgress?.(15);
  const { uploadUrl, publicUrl } = await getUploadUrl(key, uploadFile.type || "application/octet-stream");
  onProgress?.(45);

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: uploadFile,
    headers: { "Content-Type": uploadFile.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Failed to upload file to AWS S3");

  onProgress?.(100);
  return {
    url: publicUrl,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    key,
  };
}

/**
 * Upload multiple files to AWS S3 in sequence.
 */
export async function uploadMultipleFilesToS3(
  files: File[],
  folder: string,
  onProgress?: (index: number, pct: number) => void
): Promise<S3FileItem[]> {
  const results: S3FileItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const item = await uploadFileToS3(files[i], folder, (pct) => onProgress?.(i, pct));
    results.push(item);
  }
  return results;
}

/**
 * Upload a single file to S3 via presigned URL.
 * Images are compressed before upload; videos are sent as-is.
 * Returns a MediaItem with the public URL, type, and original name.
 */
export async function uploadMediaToS3(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<MediaItem> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  let uploadFile: File;
  if (isImage) {
    const compressedBlob = await compressImage(file);
    uploadFile = new File([compressedBlob], file.name, { type: file.type });
  } else {
    uploadFile = file;
  }

  const ext = isVideo ? file.name.split(".").pop() || "mp4" : "jpg";
  const key = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  onProgress?.(10);
  const { uploadUrl, publicUrl } = await getUploadUrl(key, uploadFile.type);
  onProgress?.(40);

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: uploadFile,
    headers: { "Content-Type": uploadFile.type },
  });
  if (!res.ok) throw new Error("Failed to upload file to S3");

  onProgress?.(100);
  return {
    url: publicUrl,
    type: isVideo ? "video" : "image",
    name: file.name,
  };
}

/**
 * Upload multiple files to S3 in sequence.
 * Returns an array of MediaItem objects.
 */
export async function uploadMultipleMediaToS3(
  files: File[],
  folder: string,
  onProgress?: (index: number, pct: number) => void
): Promise<MediaItem[]> {
  const results: MediaItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const item = await uploadMediaToS3(files[i], folder, (pct) => onProgress?.(i, pct));
    results.push(item);
  }
  return results;
}

async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read image."));
      el.src = url;
    });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process image."))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
