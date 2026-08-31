import type { Announcement } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAnnouncementsXLSX(announcements: Announcement[]): Promise<boolean> {
  const data = announcements.length > 0
    ? announcements.map((a) => ({
        "Broadcast ID": a.id,
        Title: a.title,
        Category: a.category.toUpperCase(),
        Priority: a.priority.toUpperCase(),
        Author: a.author_name,
        "Author Role": a.author_role,
        "Target Audience": a.visible_to || "All Staff",
        "Pinned Status": a.pinned ? "PINNED" : "STANDARD",
        "View Count": a.view_count || 0,
        "Published Date": a.published_at ? new Date(a.published_at).toLocaleDateString() : "—",
        Content: a.content || "",
      }))
    : [{
        "Broadcast ID": "—",
        Title: "No announcements found",
        Category: "—",
        Priority: "—",
        Author: "—",
        "Author Role": "—",
        "Target Audience": "—",
        "Pinned Status": "—",
        "View Count": 0,
        "Published Date": "—",
        Content: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Announcements");
  XLSX.writeFile(wb, `announcements_feed_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
