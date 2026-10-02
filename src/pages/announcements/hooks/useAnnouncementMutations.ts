import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Announcement, AnnouncementFormState } from "../types";
import { alertEmployeesAboutAnnouncement } from "./announcementNotificationHelpers";

interface UseAnnouncementMutationsProps {
  canManage: boolean;
  mustAcceptUrgentAnnouncements: boolean;
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  setAcceptedUrgentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  loadAnnouncements: () => Promise<void>;
}

export function useAnnouncementMutations({
  canManage,
  mustAcceptUrgentAnnouncements,
  setAnnouncements,
  setAcceptedUrgentIds,
  setSelectedId,
  loadAnnouncements,
}: UseAnnouncementMutationsProps) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { isSuperAdmin, targetBranch } = useBranchScope();
  const authorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [submitting, setSubmitting] = useState(false);
  const [acceptingUrgent, setAcceptingUrgent] = useState(false);
  const [acceptUrgentError, setAcceptUrgentError] = useState("");

  const openAnnouncement = useCallback(async (a: Announcement) => {
    setSelectedId(a.id);
    await supabase.from("announcements").update({ view_count: (a.view_count || 0) + 1 }).eq("id", a.id);
    setAnnouncements((prev) => prev.map((item) => (item.id === a.id ? { ...item, view_count: item.view_count + 1 } : item)));
  }, [setAnnouncements, setSelectedId]);

  const acceptUrgentAnnouncement = useCallback(async (announcementId: string, title?: string) => {
    if (!user?.id || !mustAcceptUrgentAnnouncements || acceptingUrgent) return;
    setAcceptingUrgent(true);
    setAcceptUrgentError("");
    const { data, error } = await supabase
      .from("announcement_acknowledgements")
      .upsert({ announcement_id: announcementId, user_id: user.id, accepted_at: new Date().toISOString() }, { onConflict: "announcement_id,user_id" })
      .select("announcement_id")
      .single();

    setAcceptingUrgent(false);
    if (error) {
      setAcceptUrgentError("Could not accept yet. Please refresh and try again.");
      toast("Error", "Could not acknowledge urgent announcement.", "error");
      return;
    }

    setAcceptedUrgentIds((prev) => new Set(prev).add(data?.announcement_id || announcementId));
    toast("Acknowledged", "You have acknowledged this urgent announcement.", "success");
    logActivity({
      module: "announcements",
      action: "updated",
      entityType: "announcement_acknowledgement",
      entityId: announcementId,
      actorName: authorName,
      actorRole: role?.name || "Staff",
      description: `Acknowledged urgent announcement "${title || announcementId}"`,
    });
  }, [user?.id, mustAcceptUrgentAnnouncements, acceptingUrgent, authorName, role?.name, setAcceptedUrgentIds]);

  const handleTogglePin = useCallback(async (a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;

    const newPinned = !a.pinned;
    const { error } = await supabase.from("announcements").update({ pinned: newPinned }).eq("id", a.id);
    if (!error) {
      setAnnouncements((prev) => prev.map((item) => (item.id === a.id ? { ...item, pinned: newPinned } : item)));
      toast("Pin Updated", `Announcement "${a.title}" is ${newPinned ? "pinned to top" : "unpinned"}.`, "success");
      logActivity({
        module: "announcements",
        action: "updated",
        entityType: "announcement",
        entityId: a.id,
        actorName: authorName,
        actorRole: role?.name || "Unknown",
        description: `${newPinned ? "Pinned" : "Unpinned"} announcement "${a.title}"`,
      });
    }
  }, [canManage, authorName, role?.name, setAnnouncements]);

  const handleSaveAnnouncement = useCallback(async (form: AnnouncementFormState, editingId: string | null) => {
    if (!canManage) {
      toast("Permission Required", "You do not have permission to manage announcements.", "error");
      return false;
    }
    if (!form.title.trim()) {
      toast("Title Required", "Please enter an announcement headline.", "warning");
      return false;
    }
    if (submitting) return false;
    setSubmitting(true);

    try {
      const VALID_CATEGORIES = ["event", "policy", "news", "benefits", "compliance", "hr", "general"];
      const VALID_VISIBILITIES = ["all", "hq", "management"];
      const category = VALID_CATEGORIES.includes(form.category?.toLowerCase() || "") ? form.category.toLowerCase() : "general";
      const priority = ["urgent", "high", "normal"].includes(form.priority?.toLowerCase() || "") ? form.priority.toLowerCase() : "normal";
      const normalizedVis = form.visible_to?.toLowerCase() || "all";
      const visible_to = VALID_VISIBILITIES.includes(normalizedVis) ? normalizedVis : /admin|manager|lead|director/i.test(normalizedVis) ? "management" : /hq/i.test(normalizedVis) ? "hq" : "all";
      const urgent_alert_hours = Math.max(1, Math.min(168, Math.round(Number(form.urgent_alert_hours) || 24)));
      const rawBranchId = isSuperAdmin ? form.branch_id : targetBranch;
      const branch_id = rawBranchId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawBranchId)) ? String(rawBranchId) : null;

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category,
        priority,
        urgent_alert_hours,
        pinned: Boolean(form.pinned),
        visible_to,
        author_name: authorName || form.author_name || "Admin",
        author_role: role?.name || form.author_role || "Corporate Operations",
        branch_id,
      };

      if (editingId) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", editingId);
        if (error) {
          toast("Error", error.message || "Failed to update announcement", "error");
          return false;
        }
        if (payload.priority === "urgent" && user?.id) {
          try {
            await supabase.from("announcement_acknowledgements").upsert(
              { announcement_id: editingId, user_id: user.id, accepted_at: new Date().toISOString() },
              { onConflict: "announcement_id,user_id" }
            );
            setAcceptedUrgentIds((prev) => new Set(prev).add(editingId));
          } catch {
            // non-blocking
          }
        }
        toast("Announcement Updated", "Announcement changes saved successfully.", "success");
        alertEmployeesAboutAnnouncement({ id: editingId, ...payload } as Announcement, true);
        logActivity({ module: "announcements", action: "updated", entityType: "announcement", entityId: editingId, actorName: authorName, actorRole: role?.name || "Unknown", description: `Updated announcement "${form.title}"` });
      } else {
        const { data, error } = await supabase.from("announcements").insert({ ...payload, published_at: new Date().toISOString(), view_count: 0 }).select().single();
        if (error) {
          toast("Error", error.message || "Failed to post announcement", "error");
          return false;
        }
        if (payload.priority === "urgent" && user?.id && data?.id) {
          try {
            await supabase.from("announcement_acknowledgements").upsert(
              { announcement_id: data.id, user_id: user.id, accepted_at: new Date().toISOString() },
              { onConflict: "announcement_id,user_id" }
            );
            setAcceptedUrgentIds((prev) => new Set(prev).add(data.id));
          } catch {
            // non-blocking
          }
        }
        toast("Broadcast Posted", "New company announcement published successfully.", "success");
        alertEmployeesAboutAnnouncement(data as Announcement, false);
        logActivity({ module: "announcements", action: "created", entityType: "announcement", entityId: data.id, actorName: authorName, actorRole: role?.name || "Unknown", description: `Published announcement "${form.title}" (${form.category})` });
      }

      await loadAnnouncements();
      return true;
    } catch (err: any) {
      console.error("Save announcement error:", err);
      toast("Save Failed", err?.message || "An unexpected error occurred while saving.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [canManage, submitting, authorName, role?.name, isSuperAdmin, targetBranch, user?.id, setAcceptedUrgentIds, loadAnnouncements]);

  const deleteAnnouncement = useCallback(async (a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;
    if (!confirm(`Move announcement "${a.title}" to the Recycle Bin? It can be restored later.`)) return;

    const { error } = await supabase.from("announcements").update({ deleted_at: new Date().toISOString(), deleted_by: authorName }).eq("id", a.id);
    if (error) { toast("Error", "Failed to delete announcement", "error"); return; }

    await supabase.from("notifications").delete().eq("source", "announcements").eq("entity_id", a.id);
    setSelectedId((prev) => (prev === a.id ? null : prev));
    toast("Moved to Recycle Bin", `"${a.title}" moved to Recycle Bin.`, "success");
    logActivity({ module: "announcements", action: "deleted", entityType: "announcement", entityId: a.id, actorName: authorName, actorRole: role?.name || "Unknown", description: `Moved announcement "${a.title}" to Recycle Bin` });
    loadAnnouncements();
  }, [canManage, authorName, role?.name, setSelectedId, loadAnnouncements]);

  return {
    submitting,
    acceptingUrgent,
    acceptUrgentError,
    authorName,
    openAnnouncement,
    acceptUrgentAnnouncement,
    handleTogglePin,
    handleSaveAnnouncement,
    deleteAnnouncement,
  };
}
