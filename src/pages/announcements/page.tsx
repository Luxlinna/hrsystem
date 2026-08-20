import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  author_name: string;
  author_role: string;
  pinned: boolean;
  visible_to: string;
  published_at: string;
  urgent_alert_hours: number | null;
  view_count: number;
  created_at: string;
}

// A deliberately small palette: 4 tones, each tied to a meaning, reused
// across categories that share that meaning (rather than one arbitrary
// color per category). Rose is reserved for true urgency (PRIORITY_CONFIG)
// so it stays meaningful instead of also doing duty as a category color.
const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string; desc: string }> = {
  news: { color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: "ri-newspaper-line", label: "Company News", desc: "General releases & milestones" },
  event: { color: "text-[#253C7D]", bg: "bg-[#253C7D]/10 border-[#253C7D]/20", icon: "ri-calendar-event-line", label: "Event", desc: "Townhalls, parties & dates" },
  policy: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "ri-file-text-line", label: "Policy", desc: "SOPs & rule changes" },
  benefits: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "ri-heart-pulse-line", label: "Benefits & Perks", desc: "Health, insurance & rewards" },
  compliance: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "ri-shield-check-line", label: "Compliance", desc: "Legal, safety & audits" },
  hr: { color: "text-[#253C7D]", bg: "bg-[#253C7D]/10 border-[#253C7D]/20", icon: "ri-user-settings-line", label: "HR Updates", desc: "Staffing, shifts & org notes" },
  general: { color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: "ri-information-line", label: "General Notice", desc: "General information" },
};

const PRIORITY_CONFIG: Record<string, { label: string; badge: string; dot: string; desc: string }> = {
  normal: { label: "Normal", badge: "bg-gray-100 text-gray-700 border-gray-200 font-medium", dot: "bg-gray-400", desc: "Standard feed update" },
  high: { label: "High Priority", badge: "bg-amber-50 text-amber-700 border-amber-200 font-bold", dot: "bg-amber-500", desc: "Highlighted on boards" },
  urgent: { label: "Urgent Alert", badge: "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20 font-black", dot: "bg-rose-500", desc: "Requires staff acknowledgment" },
};

// Audience is metadata, not urgency — kept neutral so it doesn't compete
// with priority/category colors. Management gets the brand tint since
// restricted visibility is worth a small signal.
const AUDIENCE_CONFIG: Record<string, { label: string; badge: string; icon: string }> = {
  all: { label: "All Employees", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: "ri-global-line" },
  hq: { label: "HQ Staff Only", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: "ri-building-line" },
  management: { label: "Management Only", badge: "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20", icon: "ri-shield-user-line" },
};

const QUICK_EMOJIS = ["📢", "🎉", "🚨", "📅", "💡", "📌", "🎯", "⚠️", "🌟", "🏆"];

export default function Announcements() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (!!role && !["Employee", "Staff"].includes(role.name));
  const mustAcceptUrgentAnnouncements = !canManage;
  const authorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const actorName = authorName;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters & Tabs
  const [mainTab, setMainTab] = useState<"all" | "urgent" | "pinned" | "policies" | "management">("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modal Composer State
  const [composerMode, setComposerMode] = useState<"write" | "preview">("write");
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [acceptedUrgentIds, setAcceptedUrgentIds] = useState<Set<string>>(new Set());
  const [acceptingUrgent, setAcceptingUrgent] = useState(false);
  const [acceptUrgentError, setAcceptUrgentError] = useState("");

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const shouldAcceptHighlighted = searchParams.get("accept") === "1";

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "news",
    priority: "normal",
    author_name: authorName,
    author_role: role?.name || "Corporate Operations",
    pinned: false,
    visible_to: "all",
    urgent_alert_hours: 24,
  });

  const selectedItem = useMemo(
    () => announcements.find((a) => a.id === selectedId) || null,
    [announcements, selectedId]
  );

  const loadAnnouncements = async () => {
    setLoading(true);
    let query = supabase
      .from("announcements")
      .select("*")
      .is("deleted_at", null)
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
  };

  const loadAcceptedUrgent = async () => {
    if (!user?.id || !mustAcceptUrgentAnnouncements) {
      setAcceptedUrgentIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("announcement_acknowledgements")
      .select("announcement_id")
      .eq("user_id", user.id);
    setAcceptedUrgentIds(new Set((data || []).map((row) => row.announcement_id)));
  };

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
  }, [canManage]);

  const acceptUrgentAnnouncement = async (announcementId: string) => {
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
  };

  useEffect(() => {
    if (
      !mustAcceptUrgentAnnouncements ||
      !highlightId ||
      !shouldAcceptHighlighted ||
      acceptedUrgentIds.has(highlightId)
    )
      return;
    acceptUrgentAnnouncement(highlightId);
  }, [highlightId, shouldAcceptHighlighted, acceptedUrgentIds, mustAcceptUrgentAnnouncements]);

  useEffect(() => {
    if (!highlightId || announcements.length === 0) return;
    const target = announcements.find((a) => a.id === highlightId);
    if (!target) return;
    setSelectedId(target.id);
  }, [highlightId, announcements]);

  const openAnnouncement = async (a: Announcement) => {
    setSelectedId(a.id);
    await supabase
      .from("announcements")
      .update({ view_count: (a.view_count || 0) + 1 })
      .eq("id", a.id);
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === a.id ? { ...item, view_count: item.view_count + 1 } : item))
    );
  };

  const alertEmployeesAboutAnnouncement = async (announcement: Announcement) => {
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
  };

  const handleTogglePin = async (a: Announcement, e?: React.MouseEvent) => {
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
  };

  const handleCopyLink = (a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/announcements?highlight=${a.id}`;
    navigator.clipboard.writeText(link);
    toast("Link Copied", "Announcement link copied to clipboard.", "success");
  };

  const handleInsertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = contentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.content;
    const selectedText = previousContent.substring(start, end);
    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    setForm((prev) => ({ ...prev, content: prev.content + " " + emoji }));
  };

  const handleCreate = async (e: React.FormEvent) => {
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
      title: "",
      content: "",
      category: "news",
      priority: "normal",
      author_name: authorName,
      author_role: role?.name || "Corporate Operations",
      pinned: false,
      visible_to: "all",
      urgent_alert_hours: 24,
    });
    setEditingId(null);
    setShowCreateModal(false);
    setComposerMode("write");
    loadAnnouncements();
  };

  const openEditModal = (a: Announcement, e?: React.MouseEvent) => {
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
    });
    setEditingId(a.id);
    setComposerMode("write");
    setShowCreateModal(true);
  };

  const deleteAnnouncement = async (a: Announcement, e?: React.MouseEvent) => {
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
  };

  const handleExportCSV = () => {
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
  };

  // Filter and tab calculation
  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      // Main Tab Filter
      if (mainTab === "urgent" && a.priority !== "urgent" && a.priority !== "high") return false;
      if (mainTab === "pinned" && !a.pinned) return false;
      if (mainTab === "policies" && a.category !== "policy" && a.category !== "compliance") return false;
      if (mainTab === "management" && a.visible_to !== "management") return false;

      // Dropdown filters
      if (filterCat !== "all" && a.category !== filterCat) return false;
      if (filterPriority !== "all" && a.priority !== filterPriority) return false;
      if (filterAudience !== "all" && a.visible_to !== filterAudience) return false;

      // Search Filter
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

  // Aggregate Metrics
  const activeCount = useMemo(() => announcements.length, [announcements]);
  const urgentCount = useMemo(() => announcements.filter((a) => a.priority === "urgent" || a.priority === "high").length, [announcements]);
  const pinnedCount = useMemo(() => announcements.filter((a) => a.pinned).length, [announcements]);
  const totalViews = useMemo(() => announcements.reduce((s, a) => s + (a.view_count || 0), 0), [announcements]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedAnnouncements = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const timeAgo = (dateStr: string) => {
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
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading company announcements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Corporate Communications</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Broadcast Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Company Announcements
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              {announcements.length} Published
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Official company broadcasts, executive updates, operational policies, and corporate events.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export Feed
          </button>

          {canManage && (
            <button
              onClick={() => {
                setForm({
                  title: "",
                  content: "",
                  category: "news",
                  priority: "normal",
                  author_name: authorName,
                  author_role: role?.name || "Corporate Operations",
                  pinned: false,
                  visible_to: "all",
                  urgent_alert_hours: 24,
                });
                setEditingId(null);
                setComposerMode("write");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-megaphone-line text-base font-bold" />
              Post Announcement
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Active Broadcasts */}
        <div
          onClick={() => {
            setMainTab("all");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            mainTab === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Broadcasts</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-megaphone-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{activeCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Company-wide releases</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Urgent & High Priority */}
        <div
          onClick={() => {
            setMainTab("urgent");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            mainTab === "urgent" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgent & Critical</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{urgentCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Requires immediate attention</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Pinned Announcements */}
        <div
          onClick={() => {
            setMainTab("pinned");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            mainTab === "pinned" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pinned Notices</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-pushpin-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pinnedCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Featured on top</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Total Reach & Engagement */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Employee Reach</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-eye-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalViews.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Cumulative staff views</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 mb-5 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Broadcasts", count: announcements.length, icon: "ri-layout-grid-line" },
          { id: "urgent", label: "Urgent & High", count: urgentCount, icon: "ri-fire-line", isAlert: urgentCount > 0 },
          { id: "pinned", label: "Pinned Notices", count: pinnedCount, icon: "ri-pushpin-line" },
          { id: "policies", label: "Policies & Compliance", count: announcements.filter((a) => a.category === "policy" || a.category === "compliance").length, icon: "ri-file-shield-line" },
          { id: "management", label: "Management Only", count: announcements.filter((a) => a.visible_to === "management").length, icon: "ri-lock-line" },
        ].map((tab) => {
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMainTab(tab.id as any);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/60 hover:bg-gray-50"
              }`}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.isAlert
                    ? "bg-rose-100 text-rose-700 font-black"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls & Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search announcements by title, author, or keywords..."
            className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Only</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal</option>
          </select>

          {/* Audience Filter */}
          <select
            value={filterAudience}
            onChange={(e) => {
              setFilterAudience(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="all">All Employees</option>
            <option value="hq">HQ Staff</option>
            <option value="management">Management</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
            <button
              onClick={() => setViewMode("cards")}
              title="Cards Grid"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-grid-fill" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-table-line" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
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
              onClick={() => {
                setForm({
                  title: "",
                  content: "",
                  category: "news",
                  priority: "normal",
                  author_name: authorName,
                  author_role: role?.name || "Corporate Operations",
                  pinned: false,
                  visible_to: "all",
                  urgent_alert_hours: 24,
                });
                setEditingId(null);
                setComposerMode("write");
                setShowCreateModal(true);
              }}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Post New Announcement
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS STREAM GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pagedAnnouncements.map((a) => {
            const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
            const pri = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
            const aud = AUDIENCE_CONFIG[a.visible_to] || AUDIENCE_CONFIG.all;
            const isSelected = selectedId === a.id;
            const isUrgentUnaccepted =
              mustAcceptUrgentAnnouncements && a.priority === "urgent" && !acceptedUrgentIds.has(a.id);

            return (
              <div
                key={a.id}
                onClick={() => openAnnouncement(a)}
                className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  a.priority === "urgent"
                    ? "border-rose-200/90 hover:border-rose-300"
                    : "border-gray-200/80 hover:border-gray-300"
                } ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
              >
                {/* Urgent alert left highlight stripe */}
                {a.priority === "urgent" && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />}

                <div>
                  {/* Top Bar: Icon + Category & Priority Badges + Quick Pin */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${cat.bg} ${cat.color}`}>
                        <i className={cat.icon} />
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                        {pri.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(a, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            a.pinned
                              ? "bg-amber-100 text-amber-700 font-bold"
                              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          }`}
                          title={a.pinned ? "Unpin from top" : "Pin to top"}
                        >
                          <i className="ri-pushpin-line text-xs" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(a, e)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition-colors"
                        title="Copy direct link"
                      >
                        <i className="ri-share-forward-line text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Preview Content */}
                  <h3 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm sm:text-[15px] leading-snug line-clamp-2 mb-2">
                    {a.pinned && (
                      <i className="ri-pushpin-fill text-amber-500 text-xs mr-1.5 inline-block" />
                    )}
                    {a.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
                    {a.content}
                  </p>

                  {/* Urgent Attention Badge */}
                  {isUrgentUnaccepted && (
                    <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[11px] font-bold">
                      <i className="ri-error-warning-line text-xs shrink-0" />
                      <span className="truncate">Requires your acknowledgment</span>
                    </div>
                  )}
                </div>

                {/* Footer Info: Author Avatar, Views, Audience, Time */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {a.author_name ? a.author_name.charAt(0).toUpperCase() : "HR"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-700 truncate">{a.author_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-0.5">
                      <i className="ri-eye-line text-xs" />
                      {a.view_count || 0}
                    </span>
                    <span>·</span>
                    <span>{timeAgo(a.published_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE AUDIT VIEW */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Announcement</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Audience</th>
                  <th className="px-5 py-3.5">Author</th>
                  <th className="px-5 py-3.5">Views</th>
                  <th className="px-5 py-3.5">Published</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedAnnouncements.map((a) => {
                  const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
                  const pri = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
                  const aud = AUDIENCE_CONFIG[a.visible_to] || AUDIENCE_CONFIG.all;

                  return (
                    <tr
                      key={a.id}
                      onClick={() => openAnnouncement(a)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5 max-w-sm">
                          {a.pinned && <i className="ri-pushpin-fill text-amber-500 text-sm shrink-0" />}
                          <span className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                            {a.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                          <i className={cat.icon} />
                          {cat.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${pri.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                          {pri.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${aud.badge}`}>
                          {aud.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                        {a.author_name}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                        {(a.view_count || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                        {timeAgo(a.published_at)}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(a, e)}
                            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            <i className="ri-share-forward-line text-sm" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => openEditModal(a, e)}
                                className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit announcement"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => deleteAnnouncement(a, e)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete announcement"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{pageStart}</span>–<span className="font-bold text-gray-900">{pageEnd}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> announcements
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {[6, 9, 18, 36].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            {pageWindow(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    p === safePage ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: HIGH-PRODUCTIVITY ANNOUNCEMENT READER                             */}
      {/* ========================================================================= */}
      {selectedItem && (() => {
        const cat = CATEGORY_CONFIG[selectedItem.category] || CATEGORY_CONFIG.general;
        const pri = PRIORITY_CONFIG[selectedItem.priority] || PRIORITY_CONFIG.normal;
        const aud = AUDIENCE_CONFIG[selectedItem.visible_to] || AUDIENCE_CONFIG.all;
        const isUrgent = selectedItem.priority === "urgent";

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedId(null)}
            />
            <div className="relative w-full sm:w-[520px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
              {/* Drawer Top Bar */}
              <div>
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cat.bg} ${cat.color} flex items-center gap-1`}>
                      <i className={cat.icon} />
                      {cat.label}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                      {pri.label}
                    </span>
                    {selectedItem.pinned && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <i className="ri-pushpin-fill" /> Pinned
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>

                {/* Quick Action Strip */}
                <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(selectedItem, e)}
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <i className="ri-share-forward-line text-[#253C7D]" />
                      Copy Link
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(selectedItem, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                          selectedItem.pinned
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <i className="ri-pushpin-line text-amber-600" />
                        {selectedItem.pinned ? "Pinned to Top" : "Pin Announcement"}
                      </button>
                    )}
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${aud.badge}`}>
                    {aud.label}
                  </span>
                </div>
              </div>

              {/* Scrollable Reader Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {selectedItem.title}
                </h2>

                {/* Author & Published Date Metadata Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                      {selectedItem.author_name ? selectedItem.author_name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{selectedItem.author_name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{selectedItem.author_role || "Corporate Operations"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">{timeAgo(selectedItem.published_at)}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(selectedItem.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Urgent Acknowledgment Banner (if required) */}
                {mustAcceptUrgentAnnouncements && isUrgent && (
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 space-y-3">
                    {acceptedUrgentIds.has(selectedItem.id) ? (
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
                        <span>You have acknowledged this urgent notice.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-rose-800 text-xs font-bold">
                          <i className="ri-error-warning-fill text-rose-600 text-base shrink-0 mt-0.5" />
                          <div>
                            <p>Immediate Employee Acknowledgment Required</p>
                            <p className="text-[11px] font-normal text-rose-700 mt-0.5">
                              Please review and acknowledge receipt of this broadcast notice.
                            </p>
                          </div>
                        </div>
                        {acceptUrgentError && (
                          <p className="text-xs font-bold text-rose-600">{acceptUrgentError}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => acceptUrgentAnnouncement(selectedItem.id)}
                          disabled={acceptingUrgent}
                          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {acceptingUrgent ? "Recording..." : "Acknowledge Announcement"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Announcement Content Box */}
                <div className="prose prose-sm text-gray-800 leading-relaxed whitespace-pre-line text-xs sm:text-[13px] bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                  {selectedItem.content}
                </div>

                {/* Engagement Stats Bar */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 font-bold text-gray-700">
                    <i className="ri-eye-line text-base text-[#253C7D]" />
                    <span>{(selectedItem.view_count || 0).toLocaleString()} Staff Views</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <i className="ri-global-line text-gray-400" />
                    <span>Visibility: <strong>{aud.label}</strong></span>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions Footer */}
              <div className="p-4 border-t border-gray-100 bg-white space-y-2 shrink-0">
                {canManage ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => openEditModal(selectedItem, e)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#253C7D] text-white hover:bg-[#1E3064] transition-colors cursor-pointer shadow-xs"
                    >
                      <i className="ri-edit-line text-sm" />
                      Edit Broadcast
                    </button>

                    <button
                      onClick={(e) => deleteAnnouncement(selectedItem, e)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                      Move to Bin
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close Reader
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: ULTRA-MODERN HIGH-PRODUCTIVITY ANNOUNCEMENT COMPOSER               */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !submitting && setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                  <i className={editingId ? "ri-edit-line" : "ri-megaphone-line"} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    {editingId ? "Edit Company Announcement" : "Create Broadcast Announcement"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingId ? "Update announcement parameters and messaging" : "Broadcast company news, operational updates, and policies"}
                  </p>
                </div>
              </div>

              {/* Mode Toggle & Close Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
                  <button
                    type="button"
                    onClick={() => setComposerMode("write")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      composerMode === "write" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <i className="ri-pencil-line" />
                    <span>Composer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode("preview")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      composerMode === "preview" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <i className="ri-eye-line" />
                    <span>Card Preview</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreate} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {composerMode === "write" ? (
                <>
                  {/* Category Selection Grid */}
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
                      Announcement Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                        const isSelected = form.category === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm({ ...form, category: key })}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-current/20 shadow-xs scale-[1.02]`
                                : "bg-white border-gray-200/80 text-gray-700 hover:bg-slate-50 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <i className={`${cfg.icon} text-base`} />
                              {isSelected && <i className="ri-checkbox-circle-fill text-xs" />}
                            </div>
                            <p className="text-xs font-black truncate">{cfg.label}</p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{cfg.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Level Segmented Cards */}
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
                      Priority & Urgency Level <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {Object.entries(PRIORITY_CONFIG).map(([key, pri]) => {
                        const isSelected = form.priority === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm({ ...form, priority: key })}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? key === "urgent"
                                  ? "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                                  : key === "high"
                                  ? "bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20 shadow-xs"
                                  : "bg-[#253C7D]/10 border-[#253C7D]/40 text-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                                : "bg-white border-gray-200/80 text-gray-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${pri.dot} shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black">{pri.label}</p>
                              <p className="text-[10px] text-gray-400 truncate">{pri.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.priority === "urgent" && (
                    <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                          <label className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block mb-1">
                            Urgent Alert Duration
                          </label>
                          <p className="text-[11px] text-rose-700/70 font-medium">
                            Staff will be alerted every 30 seconds until accepted or until this time expires.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={form.urgent_alert_hours}
                            onChange={(e) => {
                              const nextValue = Math.min(168, Math.max(1, Number(e.target.value) || 1));
                              setForm({ ...form, urgent_alert_hours: nextValue });
                            }}
                            className="w-20 px-3 py-2 bg-white border border-rose-200 rounded-xl text-sm font-extrabold text-rose-800 focus:outline-none focus:border-rose-500"
                          />
                          <span className="text-xs font-bold text-rose-700">hours</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Announcement Title */}
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Headline Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Annual Company All-Hands Meeting & Q3 Review"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] shadow-2xs"
                    />
                  </div>

                  {/* Audience & Author details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Target Audience */}
                    <div>
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Target Audience <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(AUDIENCE_CONFIG).map(([key, aud]) => {
                          const isSelected = form.visible_to === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setForm({ ...form, visible_to: key })}
                              className={`px-2 py-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                              }`}
                            >
                              <i className={aud.icon} />
                              <span className="truncate">{key === "all" ? "All Staff" : key === "hq" ? "HQ Only" : "Managers"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Author & Role */}
                    <div>
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Issuer / Author Details
                      </label>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-gray-200 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {form.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{form.author_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{form.author_role}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Message Body + Quick Formatting Toolbar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                        Broadcast Message Body <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {form.content.length} characters
                      </span>
                    </div>

                    {/* Formatting Helper Toolbar */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 border-b-0 rounded-t-xl overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting("**", "**")}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-black text-gray-700 transition-colors cursor-pointer"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting("*", "*")}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs italic font-serif text-gray-700 transition-colors cursor-pointer"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting("• ")}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                        title="Bullet List"
                      >
                        <i className="ri-list-unordered" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting("1. ")}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                        title="Numbered List"
                      >
                        <i className="ri-list-ordered" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting("> ")}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                        title="Quote / Callout"
                      >
                        <i className="ri-double-quotes-l" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1" />

                      {/* Emojis */}
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleInsertEmoji(emoji)}
                          className="px-1.5 py-0.5 hover:bg-white rounded text-xs transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={contentInputRef}
                      required
                      rows={5}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Write complete broadcast details, schedules, key contact points, and instructions for team members..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-b-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed resize-none shadow-2xs"
                    />
                  </div>

                  {/* Pin to Top Toggle Banner */}
                  <div
                    onClick={() => setForm({ ...form, pinned: !form.pinned })}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      form.pinned
                        ? "bg-amber-50/70 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-gray-200/80 text-gray-700 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                          form.pinned ? "bg-amber-100 text-amber-700" : "bg-white text-gray-400 border border-gray-200"
                        }`}
                      >
                        <i className="ri-pushpin-fill" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold">Pin Announcement to Top</p>
                        <p className="text-[11px] text-gray-400">
                          Featured at the very top of all staff feeds and dashboards
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.pinned}
                      onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW MODE */
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl text-xs text-[#253C7D] flex items-center gap-2">
                    <i className="ri-eye-line text-base shrink-0" />
                    <span>This is a live preview of how your announcement card will appear on employee feeds:</span>
                  </div>

                  {/* Simulated Card */}
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-md relative overflow-hidden">
                    {form.priority === "urgent" && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />}

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const cat = CATEGORY_CONFIG[form.category] || CATEGORY_CONFIG.news;
                          const pri = PRIORITY_CONFIG[form.priority] || PRIORITY_CONFIG.normal;
                          return (
                            <>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${cat.bg} ${cat.color}`}>
                                <i className={cat.icon} />
                              </div>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                                {cat.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                                {pri.label}
                              </span>
                              {form.pinned && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                                  <i className="ri-pushpin-fill text-xs" /> Pinned
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">Just now</span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base leading-snug mb-2">
                      {form.title || "Untitled Announcement"}
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                      {form.content || "Your announcement content will be rendered here..."}
                    </p>

                    {form.priority === "urgent" && (
                      <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                        <i className="ri-error-warning-line text-sm" />
                        <span>Requires staff acknowledgment for {form.urgent_alert_hours} hours</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[10px] font-extrabold">
                          {form.author_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-700">{form.author_name}</span>
                        <span>·</span>
                        <span className="capitalize">{AUDIENCE_CONFIG[form.visible_to]?.label || "All Employees"}</span>
                      </div>
                      <span>0 views</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 flex gap-2.5 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <i className="ri-send-plane-fill text-sm" />
                  <span>
                    {submitting
                      ? "Publishing Broadcast..."
                      : editingId
                      ? "Save Changes"
                      : "Publish Announcement"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
