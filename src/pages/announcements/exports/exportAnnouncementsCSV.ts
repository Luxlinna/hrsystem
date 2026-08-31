import type { Announcement } from "../types";

export function exportAnnouncementsCSV(announcements: Announcement[]): boolean {
  const headers = [
    "Title",
    "Category",
    "Priority",
    "Author",
    "Author Role",
    "Visible To",
    "Pinned",
    "Views",
    "Published Date",
  ];

  const rows = announcements.map((a) => [
    `"${a.title.replace(/"/g, '""')}"`,
    `"${a.category}"`,
    `"${a.priority}"`,
    `"${a.author_name.replace(/"/g, '""')}"`,
    `"${a.author_role.replace(/"/g, '""')}"`,
    `"${a.visible_to || "All Staff"}"`,
    a.pinned ? "Yes" : "No",
    a.view_count || 0,
    `"${a.published_at || a.created_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `announcements_feed_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
