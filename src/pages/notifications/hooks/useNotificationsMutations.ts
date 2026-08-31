import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { getNotificationTarget } from "@/lib/notificationRoutes";
import type { Notification } from "../types";

interface UseNotificationsMutationsProps {
  setNotifs: React.Dispatch<React.SetStateAction<Notification[]>>;
  visibleNotifs: Notification[];
  can: (module: string) => boolean;
}

export function useNotificationsMutations({
  setNotifs,
  visibleNotifs,
  can,
}: UseNotificationsMutationsProps) {
  const navigate = useNavigate();

  const markRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, [setNotifs]);

  const markAllRead = useCallback(async () => {
    const unreadIds = visibleNotifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    const idSet = new Set(unreadIds);
    setNotifs((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, is_read: true } : n)));
    toast("All read", "All notifications have been marked as read.", "success");
  }, [visibleNotifs, setNotifs]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, [setNotifs]);

  const openNotification = useCallback((n: Notification) => {
    if (!n.is_read) markRead(n.id);
    const target = getNotificationTarget(n.source, n.entity_id, n.title, n.message);
    if (target && can(target.module)) navigate(target.path);
  }, [markRead, can, navigate]);

  const isNavigable = useCallback((n: Notification) => {
    const target = getNotificationTarget(n.source, n.entity_id, n.title, n.message);
    return Boolean(target) && can(target.module);
  }, [can]);

  return {
    markRead,
    markAllRead,
    deleteNotification,
    openNotification,
    isNavigable,
  };
}
