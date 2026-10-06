import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";
import { resolveResetPasswordSession } from "./resetPasswordSessionResolver";

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

    const init = async () => {
      const result = await resolveResetPasswordSession();
      if (!isMounted) return;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      setHasSession(result.hasSession);
      setInvitedEmail(result.email);
      setChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        const isInviteMode = new URLSearchParams(window.location.search).get("mode") === "invite";
        if (isInviteMode && session.user.user_metadata?.account_activated === true) {
          setHasSession(false);
          setChecking(false);
          return;
        }
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setHasSession(true);
        setInvitedEmail(session.user.email || "");
        setChecking(false);
      }
    });

    init();
    fallbackTimer = setTimeout(() => {
      if (isMounted) setChecking(false);
    }, 10000);

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
      await supabase.auth.updateUser({
        data: {
          invite_pending: false,
          account_activated: true,
          invite_completed_at: new Date().toISOString(),
        },
      }).catch(() => {});
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
    password, setPassword,
    confirm, setConfirm,
    error, loading, checking,
    hasSession, invitedEmail, handleSubmit,
  };
}
