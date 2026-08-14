import { supabase } from "./supabase";

type NotificationType = "info" | "warning" | "success" | "error";
type NotificationSource = "hire" | "leave" | "payroll" | "branches" | "system" | "employees" | "onboarding" | "offboard" | "finance" | "it_management" | "benefits" | "tools" | "announcements";

interface NotifyInput {
  title: string;
  message: string;
  type?: NotificationType;
  source: NotificationSource;
  entityId?: string | null;
  recipientUserId?: string | null;
}

export function notify(entry: NotifyInput) {
  supabase.from("notifications").insert({
    title: entry.title,
    message: entry.message,
    type: entry.type ?? "info",
    source: entry.source,
    entity_id: entry.entityId ?? null,
    recipient_user_id: entry.recipientUserId ?? null,
  }).then(({ error }) => {
    if (error) console.error("notification failed:", error.message);
  });
}
