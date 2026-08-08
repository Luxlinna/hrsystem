import { supabase } from "./supabase";

type NotificationType = "info" | "warning" | "success" | "error";
type NotificationSource = "hire" | "leave" | "payroll" | "branches" | "system" | "employees" | "onboarding" | "offboard" | "finance" | "it_management" | "benefits" | "tools";

interface NotifyInput {
  title: string;
  message: string;
  type?: NotificationType;
  source: NotificationSource;
  // The record this notification is about (e.g. a leave_requests.id or
  // offboarding_requests.id) — lets clicking the notification jump straight
  // to that record instead of just the module's list page.
  entityId?: string | null;
}

// Company-wide notifications (the notifications table has no recipient
// column — every entry is visible to everyone with notifications access).
// Fire-and-forget: a notification should never block the action it's about.
export function notify(entry: NotifyInput) {
  supabase.from("notifications").insert({
    title: entry.title,
    message: entry.message,
    type: entry.type ?? "info",
    source: entry.source,
    entity_id: entry.entityId ?? null,
  }).then(({ error }) => {
    if (error) console.error("notification failed:", error.message);
  });
}
