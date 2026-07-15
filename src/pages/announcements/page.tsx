import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  hr: { color: "bg-[#0D7377]/10 text-[#0D7377]", icon: "ri-user-settings-line", label: "HR" },
  general: { color: "bg-gray-100 text-gray-600", icon: "ri-information-line", label: "General" },
};

const priorityConfig: Record<string, string> = {
  urgent: "bg-red-50 text-red-600 border border-red-100",
  high: "bg-amber-50 text-amber-700 border border-amber-100",
  normal: "bg-gray-50 text-gray-500 border border-gray-100",
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", category: "news", priority: "normal",
    author_name: "Sarah Mitchell", author_role: "HR Administrator",
    pinned: false, visible_to: "all",
  });

  const loadAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
    const channel = supabase.channel("announcements-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadAnnouncements())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openAnnouncement = async (a: Announcement) => {
    setSelectedItem(a);
    await supabase.from("announcements").update({ view_count: (a.view_count || 0) + 1 }).eq("id", a.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("announcements").insert({ ...form, published_at: new Date().toISOString(), view_count: 0 });
    setForm({ title: "", content: "", category: "news", priority: "normal", author_name: "Sarah Mitchell", author_role: "HR Administrator", pinned: false, visible_to: "all" });
    setShowCreateModal(false);
    setSubmitting(false);
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
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line" /> Post Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Object.entries(categoryConfig).slice(0, 4).map(([key, cfg]) => {
            const count = announcements.filter((a) => a.category === key).length;
            return (
              <div key={key} className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-[#0D7377]/30 transition-all" onClick={() => setFilterCat(filterCat === key ? "all" : key)}>
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
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] bg-white"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer">
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer">
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="flex gap-6">
          {/* Main List */}
          <div className={`flex-1 transition-all ${selectedItem ? "max-w-[60%]" : ""}`}>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-[#0D7377] uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
            <div className="w-[380px] shrink-0">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {selectedItem.pinned && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0D7377]/10 text-[#0D7377] flex items-center gap-1">
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
                    <button onClick={() => setSelectedItem(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer shrink-0">
                      <i className="ri-close-line text-gray-500 text-sm" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] text-xs font-bold">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-[15px] font-bold text-gray-900">Post New Announcement</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Title *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                    {Object.entries(categoryConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{form.content.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Author Name</label>
                  <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Visible To</label>
                  <select value={form.visible_to} onChange={(e) => setForm({ ...form, visible_to: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                    <option value="all">All Employees</option>
                    <option value="hq">HQ Only</option>
                    <option value="management">Management</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="w-4 h-4 rounded accent-[#0D7377]" />
                <span className="text-[13px] text-gray-700">Pin this announcement to the top</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] disabled:opacity-60 cursor-pointer">
                  {submitting ? "Posting..." : "Post Announcement"}
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
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:border-[#0D7377]/30 transition-all ${isSelected ? "border-[#0D7377] ring-2 ring-[#0D7377]/10" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 ${cfg.color}`}>
          <i className={`${cfg.icon} text-base`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {a.pinned && <i className="ri-pushpin-line text-[#0D7377] text-xs" />}
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