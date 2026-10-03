import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Announcement, AnnouncementFormState, ComposerMode } from "../types";
import { useAnnouncementsData } from "./useAnnouncementsData";
import { useAnnouncementMutations } from "./useAnnouncementMutations";
import { useAnnouncementFilters } from "./useAnnouncementFilters";

const INITIAL_FORM: AnnouncementFormState = {
  title: "",
  content: "",
  category: "news",
  priority: "normal",
  author_name: "",
  author_role: "",
  pinned: false,
  visible_to: "all",
  urgent_alert_hours: 24,
  branch_id: null,
};

export function useAnnouncements() {
  const { role, isAdmin, isBranchAdmin } = usePermissions();
  const { isSuperAdmin, userBranchName, userBranchId, isPartnerBranchBlocked } = useBranchScope();
  const [searchParams] = useSearchParams();

  const canManage = (isAdmin || isBranchAdmin || (!!role && !["Employee", "Staff", "Chairman"].includes(role.name))) && !isPartnerBranchBlocked;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<ComposerMode>("write");

  const data = useAnnouncementsData(canManage);
  const mutations = useAnnouncementMutations({
    canManage,
    mustAcceptUrgentAnnouncements: data.mustAcceptUrgentAnnouncements,
    setAnnouncements: data.setAnnouncements,
    setAcceptedUrgentIds: data.setAcceptedUrgentIds,
    setSelectedId,
    loadAnnouncements: data.loadAnnouncements,
  });
  const filters = useAnnouncementFilters(data.announcements);

  const [form, setForm] = useState<AnnouncementFormState>({
    ...INITIAL_FORM,
    author_name: mutations.authorName,
    author_role: role?.name || "Corporate Operations",
  });

  const selectedItem = useMemo(
    () => data.announcements.find((a) => a.id === selectedId) || null,
    [data.announcements, selectedId]
  );

  const highlightId = searchParams.get("highlight");
  const shouldAcceptHighlighted = searchParams.get("accept") === "1";

  useEffect(() => {
    if (!data.mustAcceptUrgentAnnouncements || !highlightId || !shouldAcceptHighlighted || data.acceptedUrgentIds.has(highlightId)) return;
    mutations.acceptUrgentAnnouncement(highlightId);
  }, [highlightId, shouldAcceptHighlighted, data.acceptedUrgentIds, data.mustAcceptUrgentAnnouncements, mutations]);

  useEffect(() => {
    if (!highlightId || data.announcements.length === 0) return;
    const target = data.announcements.find((a) => a.id === highlightId);
    if (target) setSelectedId(target.id);
  }, [highlightId, data.announcements]);

  const openCreateModal = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      author_name: mutations.authorName,
      author_role: role?.name || "Corporate Operations",
      branch_id: isSuperAdmin ? null : userBranchId,
    });
    setEditingId(null);
    setComposerMode("write");
    setShowCreateModal(true);
  }, [mutations.authorName, role?.name, isSuperAdmin, userBranchId]);

  const openEditModal = useCallback((a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      author_name: a.author_name,
      author_role: a.author_role,
      pinned: a.pinned,
      visible_to: a.visible_to,
      urgent_alert_hours: a.urgent_alert_hours || 24,
      branch_id: a.branch_id,
    });
    setEditingId(a.id);
    setComposerMode("write");
    setShowCreateModal(true);
  }, [canManage]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await mutations.handleSaveAnnouncement(form, editingId);
    if (ok) {
      setForm({ ...INITIAL_FORM, author_name: mutations.authorName, author_role: role?.name || "Corporate Operations", branch_id: isSuperAdmin ? null : userBranchId });
      setEditingId(null);
      setShowCreateModal(false);
      setComposerMode("write");
    }
  }, [mutations, form, editingId, isSuperAdmin, userBranchId, role?.name]);

  return {
    canManage,
    isSuperAdmin,
    userBranchName,
    userBranchId,
    selectedId,
    setSelectedId,
    selectedItem,
    showCreateModal,
    setShowCreateModal,
    editingId,
    setEditingId,
    composerMode,
    setComposerMode,
    form,
    setForm,
    data,
    mutations,
    filters,
    openCreateModal,
    openEditModal,
    handleFormSubmit,
  };
}
