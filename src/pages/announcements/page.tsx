import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type {
  Announcement,
  AnnouncementFormState,
  AnnouncementTabKey,
  ComposerMode,
  ViewMode,
} from "./types";
import { CATEGORY_CONFIG } from "./constants";
import { AnnouncementHeader } from "./components/AnnouncementHeader";
import { MetricCards } from "./components/MetricCards";
import { FilterBar } from "./components/FilterBar";
import { AnnouncementCardsView } from "./components/AnnouncementCardsView";
import { AnnouncementTableView } from "./components/AnnouncementTableView";
import { Pagination } from "./components/Pagination";
import { AnnouncementDrawer } from "./components/AnnouncementDrawer";
import { AnnouncementComposerModal } from "./components/AnnouncementComposerModal";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

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

export default function Announcements() {
  const { user } = useAuth();
  const { role, isAdmin, isBranchAdmin } = usePermissions();
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' announcements/bulletins.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const canManage =
    (isAdmin || isBranchAdmin || (!!role && !["Employee", "Staff", "Chairman"].includes(role.name))) &&
    !isPartnerBranchBlocked;
  const mustAcceptUrgentAnnouncements = !canManage && !isPartnerBranchBlocked;
  const authorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters & Tabs
  const [mainTab, setMainTab] = useState<AnnouncementTabKey>("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Modal Composer State
  const [composerMode, setComposerMode] = useState<ComposerMode>("write");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  // Form & Urgent Acknowledgement State
  const [submitting, setSubmitting] = useState(false);
  const [acceptedUrgentIds, setAcceptedUrgentIds] = useState<Set<string>>(new Set());
  const [acceptingUrgent, setAcceptingUrgent] = useState(false);
  const [acceptUrgentError, setAcceptUrgentError] = useState("");

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const shouldAcceptHighlighted = searchParams.get("accept") === "1";

  const [form, setForm] = useState<AnnouncementFormState>({
    ...INITIAL_FORM,
    author_name: authorName,
    author_role: role?.name || "Corporate Operations",
  });

  const selectedItem = useMemo(
    () => announcements.find((a) => a.id === selectedId) || null,
    [announcements, selectedId]
  );

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

  const acceptUrgentAnnouncement = useCallback(async (announcementId: string) => {
    if (!user?.id || !mustAcceptUrgentAnnouncements || acceptingUrgent) return;
    setAcceptingUrgent(true);
    setAcceptUrgentError("");
    const { data, error } = await supabase
      .from("announcement_acknowledgements")
      .upsert(
        { announcement_id: announcementId, user_id: user.id, accepted_at: new Date().toISOString() },
        { onConflict: "announcement_id,user_id" }
      )
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
      description: `Acknowledged urgent announcement "${selectedItem?.title || announcementId}"`,
    });
  }, [user?.id, mustAcceptUrgentAnnouncements, acceptingUrgent, authorName, role?.name, selectedItem?.title]);

  useEffect(() => {
    if (
      !mustAcceptUrgentAnnouncements ||
      !highlightId ||
      !shouldAcceptHighlighted ||
      acceptedUrgentIds.has(highlightId)
    )
      return;
    acceptUrgentAnnouncement(highlightId);
  }, [highlightId, shouldAcceptHighlighted, acceptedUrgentIds, mustAcceptUrgentAnnouncements, acceptUrgentAnnouncement]);

  useEffect(() => {
    if (!highlightId || announcements.length === 0) return;
    const target = announcements.find((a) => a.id === highlightId);
    if (!target) return;
    setSelectedId(target.id);
  }, [highlightId, announcements]);

  const openAnnouncement = useCallback(async (a: Announcement) => {
    setSelectedId(a.id);
    await supabase
      .from("announcements")
      .update({ view_count: (a.view_count || 0) + 1 })
      .eq("id", a.id);
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === a.id ? { ...item, view_count: item.view_count + 1 } : item))
    );
  }, []);

  const alertEmployeesAboutAnnouncement = useCallback(async (announcement: Announcement) => {
    const category = CATEGORY_CONFIG[announcement.category]?.label || "Announcement";
    const title = announcement.priority === "urgent" ? `🚨 Urgent: ${announcement.title}` : `📢 ${announcement.title}`;
    const message = announcement.content.slice(0, 140);
    const notificationType = announcement.priority === "urgent" ? "error" : announcement.priority === "high" ? "warning" : "info";

    const { error } = await supabase.rpc("create_announcement_notifications", {
      p_announcement_id: announcement.id,
      p_title: title,
      p_message: message,
      p_type: notificationType,
    });

    if (error) {
      notify({ source: "announcements", type: notificationType, title, message, entityId: announcement.id });
    }

    const fullContent =
      announcement.content.length > 3500 ? `${announcement.content.slice(0, 3500)}…` : announcement.content;
    notifyTelegramEvent(
      `${announcement.priority === "urgent" ? "🚨" : "📢"} <b>${escapeTelegramHtml(title.replace(/^(🚨 Urgent: |📢 )/, ""))}</b>\n\n🏷 <b>Category:</b> ${escapeTelegramHtml(category)}\n✍️ <b>By:</b> ${escapeTelegramHtml(announcement.author_name)}\n\n${escapeTelegramHtml(fullContent)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/announcements") }
    );
  }, []);

  const handleTogglePin = useCallback(async (a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;

    const newPinned = !a.pinned;
    const { error } = await supabase.from("announcements").update({ pinned: newPinned }).eq("id", a.id);
    if (!error) {
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === a.id ? { ...item, pinned: newPinned } : item))
      );
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
  }, [canManage, authorName, role?.name]);

  const handleCopyLink = useCallback((a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/announcements?highlight=${a.id}`;
    navigator.clipboard.writeText(link);
    toast("Link Copied", "Announcement link copied to clipboard.", "success");
  }, []);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || submitting || !form.title.trim()) return;
    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          priority: form.priority,
          urgent_alert_hours: form.urgent_alert_hours,
          pinned: form.pinned,
          visible_to: form.visible_to,
          branch_id: isSuperAdmin ? form.branch_id : targetBranch,
        })
        .eq("id", editingId);

      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to update announcement", "error");
        return;
      }

      toast("Announcement Updated", "Announcement changes saved successfully.", "success");
      logActivity({
        module: "announcements",
        action: "updated",
        entityType: "announcement",
        entityId: editingId,
        actorName: authorName,
        actorRole: role?.name || "Unknown",
        description: `Updated announcement "${form.title}"`,
      });
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          ...form,
          title: form.title.trim(),
          content: form.content.trim(),
          published_at: new Date().toISOString(),
          view_count: 0,
          branch_id: isSuperAdmin ? form.branch_id : targetBranch,
        })
        .select()
        .single();

      setSubmitting(false);
      if (error) {
        toast("Error", error.message || "Failed to post announcement", "error");
        return;
      }

      toast("Broadcast Posted", "New company announcement published successfully.", "success");
      alertEmployeesAboutAnnouncement(data as Announcement);
      logActivity({
        module: "announcements",
        action: "created",
        entityType: "announcement",
        entityId: data.id,
        actorName: authorName,
        actorRole: role?.name || "Unknown",
        description: `Published announcement "${form.title}" (${form.category})`,
      });
    }

    setForm({
      ...INITIAL_FORM,
      author_name: authorName,
      author_role: role?.name || "Corporate Operations",
      branch_id: isSuperAdmin ? null : userBranchId,
    });
    setEditingId(null);
    setShowCreateModal(false);
    setComposerMode("write");
    loadAnnouncements();
  }, [canManage, submitting, form, editingId, isSuperAdmin, targetBranch, userBranchId, authorName, role?.name, alertEmployeesAboutAnnouncement, loadAnnouncements]);

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

  const deleteAnnouncement = useCallback(async (a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;
    if (!confirm(`Move announcement "${a.title}" to the Recycle Bin? It can be restored later.`)) return;

    const { error } = await supabase
      .from("announcements")
      .update({ deleted_at: new Date().toISOString(), deleted_by: authorName })
      .eq("id", a.id);

    if (error) {
      toast("Error", "Failed to delete announcement", "error");
      return;
    }

    await supabase.from("notifications").delete().eq("source", "announcements").eq("entity_id", a.id);
    setSelectedId((prev) => (prev === a.id ? null : prev));
    toast("Moved to Recycle Bin", `"${a.title}" moved to Recycle Bin.`, "success");
    logActivity({
      module: "announcements",
      action: "deleted",
      entityType: "announcement",
      entityId: a.id,
      actorName: authorName,
      actorRole: role?.name || "Unknown",
      description: `Moved announcement "${a.title}" to Recycle Bin`,
    });
    loadAnnouncements();
  }, [canManage, authorName, role?.name, loadAnnouncements]);

  // Filter calculation
  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (mainTab === "urgent" && a.priority !== "urgent" && a.priority !== "high") return false;
      if (mainTab === "pinned" && !a.pinned) return false;
      if (mainTab === "policies" && a.category !== "policy" && a.category !== "compliance") return false;
      if (mainTab === "management" && a.visible_to !== "management") return false;

      if (filterCat !== "all" && a.category !== filterCat) return false;
      if (filterPriority !== "all" && a.priority !== filterPriority) return false;
      if (filterAudience !== "all" && a.visible_to !== filterAudience) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const t = (a.title || "").toLowerCase();
        const c = (a.content || "").toLowerCase();
        const auth = (a.author_name || "").toLowerCase();
        if (!t.includes(q) && !c.includes(q) && !auth.includes(q)) return false;
      }
      return true;
    });
  }, [announcements, mainTab, filterCat, filterPriority, filterAudience, searchTerm]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Title", "Category", "Priority", "Target Audience", "Author", "Views", "Pinned", "Published Date", "Content"];
    const rows = filtered.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.priority}"`,
      `"${a.visible_to}"`,
      `"${a.author_name}"`,
      a.view_count || 0,
      a.pinned ? "Yes" : "No",
      `"${a.published_at}"`,
      `"${(a.content || "").replace(/"/g, '""')}"`,
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `announcements_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filtered.length} announcements.`, "success");
  }, [filtered]);

  // Aggregate Metrics
  const activeCount = announcements.length;
  const urgentCount = useMemo(() => announcements.filter((a) => a.priority === "urgent" || a.priority === "high").length, [announcements]);
  const pinnedCount = useMemo(() => announcements.filter((a) => a.pinned).length, [announcements]);
  const totalViews = useMemo(() => announcements.reduce((s, a) => s + (a.view_count || 0), 0), [announcements]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedAnnouncements = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const timeAgo = useCallback((dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 7)
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (d >= 1) return `${d}d ago`;
    if (h >= 1) return `${h}h ago`;
    if (m >= 1) return `${m}m ago`;
    return "Just now";
  }, []);

  const openCreateModal = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      author_name: authorName,
      author_role: role?.name || "Corporate Operations",
      branch_id: isSuperAdmin ? null : userBranchId,
    });
    setEditingId(null);
    setComposerMode("write");
    setShowCreateModal(true);
  }, [authorName, role?.name, isSuperAdmin, userBranchId]);

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading company announcements...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <AnnouncementHeader
          publishedCount={0}
          canManage={false}
          onExportCSV={() => {}}
          onOpenCreateModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Announcements & Bulletins"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <AnnouncementHeader
        publishedCount={announcements.length}
        canManage={canManage}
        onExportCSV={handleExportCSV}
        onOpenCreateModal={openCreateModal}
      />

      {/* KPI Performance Metric Cards */}
      <MetricCards
        activeCount={activeCount}
        urgentCount={urgentCount}
        pinnedCount={pinnedCount}
        totalViews={totalViews}
        mainTab={mainTab}
        onSelectTab={(t) => {
          setMainTab(t);
          setPage(1);
        }}
      />

      {/* Tabs & Search & Filter Controls */}
      <FilterBar
        announcements={announcements}
        mainTab={mainTab}
        setMainTab={setMainTab}
        urgentCount={urgentCount}
        pinnedCount={pinnedCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCat={filterCat}
        setFilterCat={setFilterCat}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterAudience={filterAudience}
        setFilterAudience={setFilterAudience}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onFilterChange={() => setPage(1)}
      />

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-newspaper-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Announcements Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No announcements match your selected tab, category filter, priority, or search term.
          </p>
          {canManage && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Post New Announcement
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <AnnouncementCardsView
          announcements={pagedAnnouncements}
          selectedId={selectedId}
          canManage={canManage}
          mustAcceptUrgentAnnouncements={mustAcceptUrgentAnnouncements}
          acceptedUrgentIds={acceptedUrgentIds}
          timeAgo={timeAgo}
          onOpen={openAnnouncement}
          onTogglePin={handleTogglePin}
          onCopyLink={handleCopyLink}
        />
      ) : (
        <AnnouncementTableView
          announcements={pagedAnnouncements}
          canManage={canManage}
          timeAgo={timeAgo}
          onOpen={openAnnouncement}
          onCopyLink={handleCopyLink}
          onOpenEditModal={openEditModal}
          onDeleteAnnouncement={deleteAnnouncement}
        />
      )}

      {/* Pagination Controls */}
      <Pagination
        totalCount={filtered.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />

      {/* Slide-over Reader Drawer */}
      <AnnouncementDrawer
        selectedItem={selectedItem}
        onClose={() => setSelectedId(null)}
        canManage={canManage}
        mustAcceptUrgentAnnouncements={mustAcceptUrgentAnnouncements}
        acceptedUrgentIds={acceptedUrgentIds}
        acceptingUrgent={acceptingUrgent}
        acceptUrgentError={acceptUrgentError}
        timeAgo={timeAgo}
        onAcceptUrgent={acceptUrgentAnnouncement}
        onTogglePin={handleTogglePin}
        onCopyLink={handleCopyLink}
        onOpenEditModal={openEditModal}
        onDeleteAnnouncement={deleteAnnouncement}
      />

      {/* Composer Modal */}
      <AnnouncementComposerModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingId(null);
        }}
        editingId={editingId}
        form={form}
        setForm={setForm}
        submitting={submitting}
        composerMode={composerMode}
        setComposerMode={setComposerMode}
        onSubmit={handleCreate}
        isSuperAdmin={isSuperAdmin}
        userBranchName={userBranchName}
        userBranchId={userBranchId}
      />
    </div>
  );
}
