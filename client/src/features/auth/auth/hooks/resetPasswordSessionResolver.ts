import { supabase } from "@/lib/supabase";

export interface SessionResolveResult {
  hasSession: boolean;
  email: string;
}

export async function resolveResetPasswordSession(): Promise<SessionResolveResult> {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);

  const hasUrlError = Boolean(
    hashParams.get("error") ||
    hashParams.get("error_code") ||
    searchParams.get("error") ||
    searchParams.get("error_code")
  );

  // 1. If explicit error in URL, link has expired or is invalid
  if (hasUrlError) {
    await supabase.auth.signOut().catch(() => {});
    return { hasSession: false, email: "" };
  }

  const isInviteMode = searchParams.get("mode") === "invite";

  // 2. Direct single-use token_hash verification
  const tokenHash = searchParams.get("token_hash");
  const otpType = (searchParams.get("type") as any) || "recovery";
  if (tokenHash) {
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });

      if (otpError || !data?.session) {
        await supabase.auth.signOut().catch(() => {});
        return { hasSession: false, email: "" };
      }

      const user = data.session.user;
      if (isInviteMode && user?.user_metadata?.account_activated === true) {
        await supabase.auth.signOut().catch(() => {});
        return { hasSession: false, email: "" };
      }

      return { hasSession: true, email: user.email || "" };
    } catch {
      await supabase.auth.signOut().catch(() => {});
      return { hasSession: false, email: "" };
    }
  }

  // 3. PKCE code exchange
  const code = searchParams.get("code");
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data?.session) {
        await supabase.auth.signOut().catch(() => {});
        return { hasSession: false, email: "" };
      }
      return { hasSession: true, email: data.session.user.email || "" };
    } catch {
      await supabase.auth.signOut().catch(() => {});
      return { hasSession: false, email: "" };
    }
  }

  // 4. Hash tokens
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error || !data?.session) {
        await supabase.auth.signOut().catch(() => {});
        return { hasSession: false, email: "" };
      }
      return { hasSession: true, email: data.session.user.email || "" };
    } catch {
      await supabase.auth.signOut().catch(() => {});
      return { hasSession: false, email: "" };
    }
  }

  // 5. Existing session check (prevent re-using invite links)
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session) {
    const user = sessionData.session.user;
    if (user?.user_metadata?.account_activated === true && !tokenHash && !code && !accessToken) {
      return { hasSession: false, email: "" };
    }
    if (isInviteMode && user?.user_metadata?.account_activated === true) {
      await supabase.auth.signOut().catch(() => {});
      return { hasSession: false, email: "" };
    }
    return { hasSession: true, email: user.email || "" };
  }

  return { hasSession: false, email: "" };
}
