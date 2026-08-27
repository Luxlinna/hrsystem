import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Notification } from "../types";

export function useNotificationsData() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setNotifs((data || []) as Notification[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.recipient_user_id && newNotif.recipient_user_id !== user.id) return;
          setNotifs((prev) => [newNotif, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.recipient_user_id && updated.recipient_user_id !== user.id) return;
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
  }, [user?.id, loadNotifications]);

  return {
    user,
    notifs,
    setNotifs,
    loading,
    realtimeEnabled,
    loadNotifications,
  };
}
