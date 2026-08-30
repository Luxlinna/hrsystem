import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { PasswordResetRequest } from "../types";
import { handlePasswordResetEdgeAction } from "../api";

interface UseAdminPasswordResetsProps {
  passwordResetRequests: PasswordResetRequest[];
  showToast: (msg: string, type?: "ok" | "err") => void;
  loadData: () => Promise<void>;
}

export function useAdminPasswordResets({
  passwordResetRequests,
  showToast,
  loadData,
}: UseAdminPasswordResetsProps) {
  const [actingResetId, setActingResetId] = useState<string | null>(null);

  const handlePasswordResetAction = useCallback(async (requestId: string, action: "approve" | "reject") => {
    setActingResetId(requestId);
    try {
      await handlePasswordResetEdgeAction(requestId, action);
      showToast(action === "approve" ? "Reset link sent to user" : "Reset request rejected");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update password reset request", "err");
    } finally {
      setActingResetId(null);
    }
  }, [showToast, loadData]);

  const deleteResetRequest = useCallback(async (request: PasswordResetRequest) => {
    if (!confirm(`Move the password reset request for "${request.email}" to the Recycle Bin?`)) return;
    setActingResetId(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("password_reset_requests")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.email || null })
        .eq("id", request.id);
      if (error) throw new Error(error.message);
      showToast("Moved to Recycle Bin");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete password reset request", "err");
    } finally {
      setActingResetId(null);
    }
  }, [showToast, loadData]);

  const pendingResetCount = useMemo(
    () => passwordResetRequests.filter((r) => r.status === "pending").length,
    [passwordResetRequests]
  );

  return {
    actingResetId,
    pendingResetCount,
    handlePasswordResetAction,
    deleteResetRequest,
  };
}
