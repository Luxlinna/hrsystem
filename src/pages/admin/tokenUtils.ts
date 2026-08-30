import { supabase } from "@/lib/supabase";

export async function readFunctionJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function getInviteError(result: any) {
  const base = result?.error || result?.message || "Failed to send invite";
  const emailErr = result?.email_error;
  return emailErr ? `${base} — ${emailErr}` : base;
}

export async function getFreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAtMs = (session?.expires_at ?? 0) * 1000;
  if (session?.access_token && expiresAtMs - Date.now() > 60_000) return session.access_token;
  const { data } = await supabase.auth.refreshSession();
  return data.session?.access_token ?? null;
}

export async function forceRefreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) console.warn("Forced session refresh failed:", error.message);
  return data.session?.access_token ?? null;
}
