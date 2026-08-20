import { supabase } from "./supabase";

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";
const FUNCTIONS_URL = `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1`;

export async function getDocumentUploadUrl(key: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${FUNCTIONS_URL}/r2-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get upload URL");
  return data;
}

export async function deleteDocument(key: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${FUNCTIONS_URL}/r2-delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete document");
}

export function getDocumentPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

export function isCloudflareR2Url(url: string | null): boolean {
  if (!url || !R2_PUBLIC_URL) return false;
  try {
    const r2Host = new URL(R2_PUBLIC_URL).hostname;
    return new URL(url).hostname === r2Host;
  } catch {
    return false;
  }
}

export function extractR2Key(url: string): string | null {
  if (!R2_PUBLIC_URL) return null;
  try {
    const r2Prefix = R2_PUBLIC_URL.replace(/\/$/, "");
    if (!url.startsWith(r2Prefix)) return null;
    return url.slice(r2Prefix.length + 1);
  } catch {
    return null;
  }
}
