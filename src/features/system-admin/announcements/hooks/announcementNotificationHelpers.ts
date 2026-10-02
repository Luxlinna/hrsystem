import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG } from "../constants";

export async function alertEmployeesAboutAnnouncement(announcement: Announcement, isUpdate = false) {
  const category = CATEGORY_CONFIG[announcement.category]?.label || "Announcement";
  const title = isUpdate
    ? announcement.priority === "urgent"
      ? `🚨 Urgent Update: ${announcement.title}`
      : `📢 Update: ${announcement.title}`
    : announcement.priority === "urgent"
    ? `🚨 Urgent: ${announcement.title}`
    : `📢 ${announcement.title}`;
  const message = announcement.content ? announcement.content.replace(/<[^>]*>?/gm, "").slice(0, 140) : "Announcement updated";
  const notificationType = announcement.priority === "urgent" ? "error" : announcement.priority === "high" ? "warning" : "info";

  try {
    await notify({
      source: "announcements",
      type: notificationType,
      title,
      message,
      entityId: announcement.id,
      branch_id: announcement.branch_id || null,
      skipTelegram: true, // We send custom rich telegram message below
    });
  } catch (err) {
    console.error("Failed to fanout announcement notifications:", err);
  }

  const rawContent = announcement.content ? announcement.content.replace(/<[^>]*>?/gm, "").trim() : "";
  const fullContent = rawContent.length > 3500 ? `${rawContent.slice(0, 3500)}…` : rawContent;
  notifyTelegramEvent(
    `${announcement.priority === "urgent" ? "🚨" : "📢"} <b>${escapeTelegramHtml(title.replace(/^(🚨 Urgent: |📢 |🚨 Urgent Update: |📢 Update: )/, ""))}</b>\n\n🏷 <b>Category:</b> ${escapeTelegramHtml(category)}\n✍️ <b>By:</b> ${escapeTelegramHtml(announcement.author_name)}\n\n${escapeTelegramHtml(fullContent)}`,
    { text: "Open in HR Nexus", url: hrNexusUrl("/announcements") }
  ).catch(() => {});
}
