import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "@/components/Toast";
import type { Announcement, AnnouncementTabKey, ViewMode } from "../types";

export function useAnnouncementFilters(announcements: Announcement[]) {
  const [mainTab, setMainTab] = useState<AnnouncementTabKey>("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedAnnouncements = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  const timeAgo = useCallback((dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 7) return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (d >= 1) return `${d}d ago`;
    if (h >= 1) return `${h}h ago`;
    if (m >= 1) return `${m}m ago`;
    return "Just now";
  }, []);

  const handleCopyLink = useCallback((a: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/announcements?highlight=${a.id}`;
    navigator.clipboard.writeText(link);
    toast("Link Copied", "Announcement link copied to clipboard.", "success");
  }, []);

  return {
    mainTab, setMainTab,
    filterCat, setFilterCat,
    filterPriority, setFilterPriority,
    filterAudience, setFilterAudience,
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    pageSize, setPageSize,
    page, setPage,
    filtered,
    totalPages,
    pagedAnnouncements,
    handleExportCSV,
    timeAgo,
    handleCopyLink,
  };
}
