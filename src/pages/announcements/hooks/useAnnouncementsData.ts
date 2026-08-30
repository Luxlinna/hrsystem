import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type { Announcement } from "../types";

export function useAnnouncementsData(canManage: boolean) {
  const { user } = useAuth();
  const { targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedUrgentIds, setAcceptedUrgentIds] = useState<Set<string>>(new Set());

  const mustAcceptUrgentAnnouncements = !canManage && !isPartnerBranchBlocked;

  const loadAnnouncements = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from("announcements")
      .select("id, title, content, category, priority, author_name, author_role, pinned, visible_to, published_at, urgent_alert_hours, view_count, created_at, branch_id")
      .is("deleted_at", null)
      .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (!canManage) {
      query = query.or("visible_to.eq.all,visible_to.eq.hq");
    }

    const { data, error } = await query;
    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, canManage]);

  const loadAcceptedUrgent = useCallback(async () => {
    if (!user?.id || !mustAcceptUrgentAnnouncements) {
      setAcceptedUrgentIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("announcement_acknowledgements")
      .select("announcement_id")
      .eq("user_id", user.id);
    setAcceptedUrgentIds(new Set((data || []).map((row) => row.announcement_id)));
  }, [user?.id, mustAcceptUrgentAnnouncements]);

  useEffect(() => {
    loadAnnouncements();
    loadAcceptedUrgent();

    const channel = supabase
      .channel("announcements-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () =>
        loadAnnouncements()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAnnouncements, loadAcceptedUrgent]);

  // Aggregate Metrics
  const activeCount = announcements.length;
  const urgentCount = useMemo(() => announcements.filter((a) => a.priority === "urgent" || a.priority === "high").length, [announcements]);
  const pinnedCount = useMemo(() => announcements.filter((a) => a.pinned).length, [announcements]);
  const totalViews = useMemo(() => announcements.reduce((s, a) => s + (a.view_count || 0), 0), [announcements]);

  return {
    announcements,
    setAnnouncements,
    loading,
    acceptedUrgentIds,
    setAcceptedUrgentIds,
    mustAcceptUrgentAnnouncements,
    activeCount,
    urgentCount,
    pinnedCount,
    totalViews,
    targetBranch,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    loadAnnouncements,
  };
}
