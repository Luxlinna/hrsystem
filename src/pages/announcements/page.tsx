import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { useSearchParams } from "react-router-dom";

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
  view_count: number;
  created_at: string;
}

const categoryConfig: Record<string, { color: string; icon: string; label: string }> = {
  event: { color: "bg-violet-50 text-violet-700", icon: "ri-calendar-event-line", label: "Event" },
  policy: { color: "bg-amber-50 text-amber-700", icon: "ri-file-text-line", label: "Policy" },
  news: { color: "bg-emerald-50 text-emerald-700", icon: "ri-newspaper-line", label: "News" },
  benefits: { color: "bg-sky-50 text-sky-700", icon: "ri-heart-pulse-line", label: "Benefits" },
  compliance: { color: "bg-red-50 text-red-600", icon: "ri-shield-check-line", label: "Compliance" },
  hr: { color: "bg-[#253C7D]/10 text-[#253C7D]", icon: "ri-user-settings-line", label: "HR" },
  general: { color: "bg-gray-100 text-gray-600", icon: "ri-information-line", label: "General" },
};

const priorityConfig: Record<string, string> = {
  urgent: "bg-red-50 text-red-600 border border-red-100",
  high: "bg-amber-50 text-amber-700 border border-amber-100",
  normal: "bg-gray-50 text-gray-500 border border-gray-100",
};

export default function Announcements() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  // Posting/editing company-wide announcements is a management action —
  // individual-contributor roles (Employee, Staff) can only read them.
  const canManage = isAdmin || (!!role && !["Employee", "Staff"].includes(role.name));
  const mustAcceptUrgentAnnouncements = Boolean(user?.id);
  const authorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedUrgentIds, setAcceptedUrgentIds] = useState<Set<string>>(new Set());
  const [acceptingUrgent, setAcceptingUrgent] = useState(false);
  const [acceptUrgentError, setAcceptUrgentError] = useState("");
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const shouldAcceptHighlighted = searchParams.get("accept") === "1";
  const [form, setForm] = useState({
    title: "", content: "", category: "news", priority: "normal",
    author_name: authorName, author_role: role?.name || "",
    pinned: false, visible_to: "all",
  });
  const selectedItem = announcements.find((a) => a.id === selectedId) || null;

  const loadAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").is("deleted_at", null).order("pinned", { ascending: false }).order("published_at", { ascending: false });
    setAnnouncements(data || []);
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
    const channel = supabase.channel("announcements-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadAnnouncements())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const acceptUrgentAnnouncement = async (announcementId: string) => {
    if (!user?.id || !mustAcceptUrgentAnnouncements || acceptingUrgent) return;
    setAcceptingUrgent(true);
    setAcceptUrgentError("");
    const { data, error } = await supabase.from("announcement_acknowledgements").upsert(
      { announcement_id: announcementId, user_id: user.id, accepted_at: new Date().toISOString() },
      { onConflict: "announcement_id,user_id" }
    ).select("announcement_id").single();
    setAcceptingUrgent(false);
    if (error) {
      setAcceptUrgentError("Could not accept yet. Please refresh and try again.");
      console.error("announcement accept failed:", error.message);
      return;
    }
    setAcceptedUrgentIds((prev) => new Set(prev).add(data?.announcement_id || announcementId));
  };

  useEffect(() => {
    if (!mustAcceptUrgentAnnouncements || !highlightId || !shouldAcceptHighlighted || acceptedUrgentIds.has(highlightId)) return;
    acceptUrgentAnnouncement(highlightId);
  }, [highlightId, shouldAcceptHighlighted, acceptedUrgentIds, mustAcceptUrgentAnnouncements]);

  useEffect(() => {
    if (!highlightId || announcements.length === 0) return;
    const target = announcements.find((a) => a.id === highlightId);
    if (!target) return;
    setSelectedId(target.id);
    const t = setTimeout(() => {
      const el = document.getElementById(`announcement-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(t);
  }, [highlightId, announcements]);

  const openAnnouncement = async (a: Announcement) => {
    setSelectedId(a.id);
    await supabase.from("announcements").update({ view_count: (a.view_count || 0) + 1 }).eq("id", a.id);
  };

  const alertEmployeesAboutAnnouncement = async (announcement: Announcement) => {
    const category = categoryConfig[announcement.category]?.label || "Announcement";
    const title = announcement.priority === "urgent" ? `Urgent ${category}` : `New ${category}`;
    const message = announcement.title;
    const notificationType = announcement.priority === "urgent" ? "error" : announcement.priority === "high" ? "warning" : "info";

    const { error } = await supabase.rpc("create_announcement_notifications", {
      p_announcement_id: announcement.id,
      p_title: title,
      p_message: message,
      p_type: notificationType,
    });

    if (error) {
      console.error("announcement notification fanout failed:", error.message);
      notify({ source: "announcements", type: notificationType, title, message, entityId: announcement.id });
    }

    supabase.functions.invoke("send-push-notification", {
      body: {
        broadcast: true,
        title,
        body: `${announcement.title}${announcement.content ? ` - ${announcement.content.slice(0, 120)}` : ""}`,
        link: `${window.location.origin}${__BASE_PATH__ === "/" ? "" : __BASE_PATH__}/announcements?highlight=${announcement.id}`,
        data: {
          source: "announcements",
          announcement_id: announcement.id,
          priority: announcement.priority,
          link: `${window.location.origin}${__BASE_PATH__ === "/" ? "" : __BASE_PATH__}/announcements?highlight=${announcement.id}`,
        },
        excludeUserId: user?.id,
      },
    }).then(({ error }) => {
      if (error) console.error("announcement push failed:", error.message);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    if (editingId) {
      await supabase.from("announcements").update({
        title: form.title, content: form.content, category: form.category,
        priority: form.priority, pinned: form.pinned, visible_to: form.visible_to,
      }).eq("id", editingId);
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({ ...form, published_at: new Date().toISOString(), view_count: 0 })
        .select()
        .single();
      if (error) {
        setSubmitting(false);
        console.error("announcement create failed:", error.message);
        return;
      }
      alertEmployeesAboutAnnouncement(data as Announcement);
    }
    setForm({ title: "", content: "", category: "news", priority: "normal", author_name: authorName, author_role: role?.name || "", pinned: false, visible_to: "all" });
    setEditingId(null);
    setShowCreateModal(false);
    setSubmitting(false);
    loadAnnouncements();
  };

  const openEditModal = (a: Announcement) => {
    if (!canManage) return;
    setForm({ title: a.title, content: a.content, category: a.category, priority: a.priority, author_name: a.author_name, author_role: a.author_role, pinned: a.pinned, visible_to: a.visible_to });
    setEditingId(a.id);
    setShowCreateModal(true);
  };

  const deleteAnnouncement = async (a: Announcement) => {
    if (!canManage) return;
    if (!confirm(`Delete announcement "${a.title}"? This cannot be undone.`)) return;
    await supabase.from("notifications").delete().eq("source", "announcements").eq("entity_id", a.id);
    await supabase.from("announcements").delete().eq("id", a.id);
    setSelectedId((prev) => (prev === a.id ? null : prev));
    loadAnnouncements();
  };

  const filtered = announcements.filter((a) => {
    const matchCat = filterCat === "all" || a.category === filterCat;
    const matchP = filterPriority === "all" || a.priority === filterPriority;
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchP && matchSearch;
  });

  const pinned = filtered.filter((a) => a.pinned);
  const regular = filtered.filter((a) => !a.pinned);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    if (d > 7) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (d >= 1) return `${d}d ago`;
    if (h >= 1) return `${h}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Company Announcements
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {announcements.length} announcements &middot; {announcements.filter((a) => a.pinned).length} pinned
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => { setForm({ title: "", content: "", category: "news", priority: "normal", author_name: authorName, author_role: role?.name || "", pinned: false, visible_to: "all" }); setEditingId(null); setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line" /> Post Announcement
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Object.entries(categoryConfig).slice(0, 4).map(([key, cfg]) => {
            const count = announcements.filter((a) => a.category === key).length;
            return (
              <div key={key} className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-[#253C7D]/30 transition-all" onClick={() => setFilterCat(filterCat === key ? "all" : key)}>
                <i className={`${cfg.icon} text-xl ${cfg.color.split(" ")[1]}`} />
                <p className="text-xl font-bold text-gray-900 mt-2">{count}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main List */}
          <div className={`flex-1 min-w-0 transition-all ${selectedItem ? "lg:max-w-[60%]" : ""}`}>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-[#253C7D] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <i className="ri-pushpin-line" /> Pinned
                </p>
                <div className="space-y-3">
                  {pinned.map((a) => (
                    <AnnouncementCard key={a.id} announcement={a} isSelected={selectedItem?.id === a.id} onClick={() => openAnnouncement(a)} timeAgo={timeAgo} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular */}
            <div className="space-y-3">
              {regular.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} isSelected={selectedItem?.id === a.id} onClick={() => openAnnouncement(a)} timeAgo={timeAgo} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <i className="ri-newspaper-line text-4xl text-gray-200" />
                <p className="text-gray-400 mt-2">No announcements found</p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div className="w-full lg:w-[380px] lg:shrink-0">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {selectedItem.pinned && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D] flex items-center gap-1">
                            <i className="ri-pushpin-line" /> Pinned
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryConfig[selectedItem.category]?.color || "bg-gray-100 text-gray-600"}`}>
                          {categoryConfig[selectedItem.category]?.label || selectedItem.category}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${priorityConfig[selectedItem.priority]}`}>
                          {selectedItem.priority}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{selectedItem.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canManage && (
                        <>
                          <button onClick={() => openEditModal(selectedItem)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer" title="Edit">
                            <i className="ri-edit-line text-gray-500 text-sm" />
                          </button>
                          <button onClick={() => deleteAnnouncement(selectedItem)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 cursor-pointer" title="Delete">
                            <i className="ri-delete-bin-line text-gray-500 hover:text-red-600 text-sm" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelectedId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                        <i className="ri-close-line text-gray-500 text-sm" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-xs font-bold">
                      {selectedItem.author_name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">{selectedItem.author_name}</p>
                      <p className="text-[11px] text-gray-400">{selectedItem.author_role}</p>
                    </div>
                    <span className="ml-auto text-[11px] text-gray-400">{timeAgo(selectedItem.published_at)}</span>
                  </div>
                </div>
                <div className="p-5 overflow-y-auto max-h-[450px]">
                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{selectedItem.content}</p>
                  {mustAcceptUrgentAnnouncements && selectedItem.priority === "urgent" && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      {acceptedUrgentIds.has(selectedItem.id) ? (
                        <p className="text-[12px] font-semibold text-red-700 flex items-center gap-2">
                          <i className="ri-checkbox-circle-line" />
                          You accepted this urgent announcement.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-[12px] font-semibold text-red-700">
                            Please accept this urgent announcement to stop repeated alerts.
                          </p>
                          {acceptUrgentError && <p className="text-[12px] font-semibold text-red-700">{acceptUrgentError}</p>}
                          <button
                            type="button"
                            onClick={() => acceptUrgentAnnouncement(selectedItem.id)}
                            disabled={acceptingUrgent}
                            className="w-full py-2 rounded-lg bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 disabled:opacity-70 cursor-pointer"
                          >
                            {acceptingUrgent ? "Accepting..." : "Accept Urgent Announcement"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-5 flex items-center gap-3 text-[11px] text-gray-400 border-t border-gray-100 pt-4">
                    <i className="ri-eye-line" />
                    <span>{(selectedItem.view_count || 0).toLocaleString()} views</span>
                    <span className="mx-1">·</span>
                    <i className="ri-global-line" />
                    <span className="capitalize">{selectedItem.visible_to === "all" ? "All Employees" : selectedItem.visible_to}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-[15px] font-bold text-gray-900">{editingId ? "Edit Announcement" : "Post New Announcement"}</h2>
              <button onClick={() => { setShowCreateModal(false); setEditingId(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Title *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer">
                    {Object.entries(categoryConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Content *</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  maxLength={500}
                  placeholder="Write the announcement content..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{form.content.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Posting As</label>
                  <p className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600">{form.author_name}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Visible To</label>
                  <select value={form.visible_to} onChange={(e) => setForm({ ...form, visible_to: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer">
                    <option value="all">All Employees</option>
                    <option value="hq">HQ Only</option>
                    <option value="management">Management</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="w-4 h-4 rounded accent-[#253C7D]" />
                <span className="text-[13px] text-gray-700">Pin this announcement to the top</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingId(null); }} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer">
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  announcement: a,
  isSelected,
  onClick,
  timeAgo,
}: {
  announcement: Announcement;
  isSelected: boolean;
  onClick: () => void;
  timeAgo: (d: string) => string;
}) {
  const cfg = categoryConfig[a.category] || categoryConfig.general;
  return (
    <div
      id={`announcement-${a.id}`}
      tabIndex={-1}
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:border-[#253C7D]/30 transition-all ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 ${cfg.color}`}>
          <i className={`${cfg.icon} text-base`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {a.pinned && <i className="ri-pushpin-line text-[#253C7D] text-xs" />}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${priorityConfig[a.priority] || ""}`}>
                  {a.priority}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-gray-900 leading-tight">{a.title}</p>
            </div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{timeAgo(a.published_at)}</span>
          </div>
          <p className="text-[12px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{a.content}</p>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <i className="ri-user-line" /> {a.author_name}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-eye-line" /> {(a.view_count || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
