import { supabase } from "@/lib/supabase";
import type { AuthAccountsResult } from "./types";

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

export async function listAuthAccounts(): Promise<AuthAccountsResult> {
  let accessToken = await getFreshAccessToken();
  if (!accessToken) return { accounts: [], assignments: null };

  const callFunction = async (token: string | null) => {
    if (!token) return null;
    return fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/list-auth-users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
      },
    });
  };

  try {
    let res = await callFunction(accessToken);
    if (res?.status === 401) {
      accessToken = await forceRefreshAccessToken();
      res = await callFunction(accessToken);
    }
    if (!res) return { accounts: [], assignments: null };
    const result = await readFunctionJson(res);
    if (!res.ok || result.error) {
      console.warn("Notice: Auth accounts list function unavailable", { status: res.status, error: result.error, detail: result.detail, result });
      return { accounts: [], assignments: null };
    }
    return {
      accounts: Array.isArray(result.users) ? result.users : [],
      assignments: Array.isArray(result.assignments) ? result.assignments : null,
    };
  } catch (err: any) {
    console.warn("Notice: Auth accounts fetch error:", err);
    return { accounts: [], assignments: null };
  }
}

export async function manageUserRole(
  action: "update_role" | "delete_assignment",
  assignmentId?: number | null,
  roleId?: number | null,
  email?: string | null,
  displayName?: string | null
) {
  const accessToken = await getFreshAccessToken();
  if (!accessToken) throw new Error("Not authenticated");

  try {
    const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        action,
        assignment_id: assignmentId && assignmentId > 0 ? assignmentId : undefined,
        role_id: roleId ?? null,
        email: email || undefined,
        display_name: displayName || undefined,
      }),
    });

    const result = await readFunctionJson(res);
    if (!res.ok || result.error) {
      throw new Error(result.error || "Failed to update user role");
    }
  } catch (err: any) {
    // If edge function returned an error, fallback to direct Supabase client call
    if (action === "update_role" && assignmentId && assignmentId > 0) {
      const { error } = await supabase
        .from("user_role_assignments")
        .update({ role_id: roleId ?? null, updated_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (error) throw new Error(error.message || err.message || "Failed to update user role");
    } else if (action === "update_role" && email) {
      const { error } = await supabase
        .from("user_role_assignments")
        .upsert({
          email: email.toLowerCase(),
          display_name: displayName || null,
          role_id: roleId ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
      if (error) throw new Error(error.message || err.message || "Failed to update user role");
    } else if (action === "delete_assignment" && assignmentId && assignmentId > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("user_role_assignments")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.email || null,
          role_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);
      if (error) throw new Error(error.message || err.message || "Failed to remove user");
    } else if (action === "delete_assignment" && email) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("user_role_assignments")
        .upsert({
          email: email.toLowerCase(),
          display_name: displayName || null,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.email || null,
          role_id: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
      if (error) throw new Error(error.message || err.message || "Failed to remove user");
    } else {
      throw err;
    }
  }
}

export async function sendUserInvite(payload: {
  email: string;
  display_name: string | null;
  role_id: string | null;
}) {
  const accessToken = await getFreshAccessToken();
  const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: payload.email,
      display_name: payload.display_name,
      role_id: payload.role_id || null,
      redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
    }),
  });
  return { res, result: await readFunctionJson(res) };
}

export async function handlePasswordResetEdgeAction(requestId: string, action: "approve" | "reject") {
  const accessToken = await getFreshAccessToken();
  if (!accessToken) throw new Error("Not authenticated");
  const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/approve-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      request_id: requestId,
      action,
      redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
    }),
  });
  const result = await readFunctionJson(res);
  if (!res.ok || result.error) {
    throw new Error([result.error, result.detail].filter(Boolean).join(" — ") || "Failed to update password reset request");
  }
  return result;
}
