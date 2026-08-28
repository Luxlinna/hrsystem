import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type { Notification } from "../types";

export function useNotificationsData() {
  const { user } = useAuth();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id || isPartnerBranchBlocked || !targetBranch) {
      setNotifs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`)
      .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
      .order("created_at", { ascending: false });
    setNotifs((data || []) as Notification[]);
    setLoading(false);
  }, [user?.id, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    if (!user?.id || isPartnerBranchBlocked || !targetBranch) {
      setNotifs([]);
      setLoading(false);
      return;
    }
    loadNotifications();

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.recipient_user_id && newNotif.recipient_user_id !== user.id) return;
          if (newNotif.branch_id !== null && newNotif.branch_id !== targetBranch) return;
          setNotifs((prev) => [newNotif, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.recipient_user_id && updated.recipient_user_id !== user.id) return;
          if (updated.branch_id !== null && updated.branch_id !== targetBranch) return;
          setNotifs((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const deleted = payload.old as Notification;
          if (deleted.recipient_user_id && deleted.recipient_user_id !== user.id) return;
          setNotifs((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        setRealtimeEnabled(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isPartnerBranchBlocked, targetBranch, loadNotifications]);

  return {
    user,
    notifs,
    setNotifs,
    loading,
    realtimeEnabled,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    targetBranch,
    loadNotifications,
  };
}
