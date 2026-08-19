import { supabase } from "./supabase";

export type NotificationType = "info" | "warning" | "success" | "error";
export type NotificationSource =
  | "hire"
  | "leave"
  | "payroll"
  | "branches"
  | "system"
  | "employees"
  | "onboarding"
  | "offboard"
  | "finance"
  | "it_management"
  | "benefits"
  | "training"
  | "tools"
  | "announcements"
  | "meeting_rooms"
  | "meeting-rooms";

export interface NotifyInput {
  title: string;
  message: string;
  type?: NotificationType;
  source: NotificationSource;
  entityId?: string | null;
  recipientUserId?: string | null;
}

// Company-wide notifications:
// Inserts into notifications table, with automatic fallback to "system"
// if a database check constraint has not yet been migrated for new sources.
export async function notify(entry: NotifyInput): Promise<boolean> {
  try {
    // Primary attempt
    const { error } = await supabase.from("notifications").insert({
      title: entry.title,
      message: entry.message,
      type: entry.type ?? "info",
      source: entry.source,
      entity_id: entry.entityId ?? null,
      recipient_user_id: entry.recipientUserId ?? null,
    });

    if (!error) {
      return true;
    }

    console.warn("Primary notification insert failed with source:", entry.source, error.message);

    // If check constraint failed or source rejected, fallback to "system" (always allowed)
    const fallbackRes = await supabase.from("notifications").insert({
      title: entry.title,
      message: entry.message,
      type: entry.type ?? "info",
      source: "system",
      entity_id: entry.entityId ?? null,
      recipient_user_id: entry.recipientUserId ?? null,
    });

    if (fallbackRes.error) {
      console.error("Fallback notification also failed:", fallbackRes.error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error in notify():", err);
    return false;
  }
}
