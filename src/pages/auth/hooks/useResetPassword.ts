import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";

export function useResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer: any = null;

    const parseAndEstablishSession = async () => {
      // 1. Check for explicit errors in URL query or hash
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const hashParams = new URLSearchParams(hash);

      const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

      if (errorCode === "otp_expired" || errorDescription?.toLowerCase().includes("expired")) {
        if (isMounted) {
          setHasSession(false);
          setChecking(false);
        }
        return;
      }

      // 1.5 If token_hash is in search parameters (crawler-safe direct link), verify via verifyOtp
      const tokenHash = searchParams.get("token_hash");
      const otpType = (searchParams.get("type") as any) || "recovery";
      if (tokenHash) {
        try {
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (data?.session && isMounted) {
            setHasSession(true);
            setInvitedEmail(data.session.user.email || "");
            setChecking(false);
            return;
          }
          if (otpError) {
            console.warn("verifyOtp warning:", otpError);
          }
        } catch (err) {
          console.warn("Error verifying OTP from token_hash:", err);
        }
      }

      // 2. If PKCE code is present in query parameters, exchange it
      const code = searchParams.get("code");
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.session && isMounted) {
            setHasSession(true);
            setInvitedEmail(data.session.user.email || "");
            setChecking(false);
            return;
          }
          if (exchangeError) {
            console.warn("exchangeCodeForSession warning:", exchangeError);
          }
        } catch (err) {
          console.warn("Error exchanging code for session:", err);
        }
      }

      // 3. If access_token & refresh_token are in hash, manually establish session
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (data?.session && isMounted) {
            setHasSession(true);
            setInvitedEmail(data.session.user.email || "");
            setChecking(false);
            return;
          }
          if (setSessionError) {
            console.warn("setSession warning:", setSessionError);
          }
        } catch (err) {
          console.warn("Error setting session from hash:", err);
        }
      }

      // 4. Check existing session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session && isMounted) {
        setHasSession(true);
        setInvitedEmail(sessionData.session.user.email || "");
        setChecking(false);
        return;
      }

      // 5. If not immediately available, give onAuthStateChange up to 2 seconds to fire
      fallbackTimer = setTimeout(() => {
        if (isMounted) {
          setChecking(false);
        }
      }, 2000);
    };

    // 6. Subscribe to auth state changes (e.g. PASSWORD_RECOVERY or SIGNED_IN)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && isMounted) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setHasSession(true);
        setInvitedEmail(session.user.email || "");
        setChecking(false);
      }
    });

    parseAndEstablishSession();

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      await supabase.auth.updateUser({ data: { invite_pending: false } }).catch(() => {});
      invalidatePermissionsCache();
      invalidateMyEmployeeCache();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirm,
    setConfirm,
    error,
    loading,
    checking,
    hasSession,
    invitedEmail,
    handleSubmit,
  };
}
