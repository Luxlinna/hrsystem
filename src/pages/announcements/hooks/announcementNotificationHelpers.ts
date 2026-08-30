import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG } from "../constants";

export async function alertEmployeesAboutAnnouncement(announcement: Announcement) {
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

  const fullContent = announcement.content.length > 3500 ? `${announcement.content.slice(0, 3500)}…` : announcement.content;
  notifyTelegramEvent(
    `${announcement.priority === "urgent" ? "🚨" : "📢"} <b>${escapeTelegramHtml(title.replace(/^(🚨 Urgent: |📢 )/, ""))}</b>\n\n🏷 <b>Category:</b> ${escapeTelegramHtml(category)}\n✍️ <b>By:</b> ${escapeTelegramHtml(announcement.author_name)}\n\n${escapeTelegramHtml(fullContent)}`,
    { text: "Open in HR Nexus", url: hrNexusUrl("/announcements") }
  );
}
