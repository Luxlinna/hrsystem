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
  | "meeting-rooms"
  | "password_reset"
  | "attendance"
  | "tasks";

export interface NotifyInput {
  title: string;
  message: string;
  type?: NotificationType | string;
  source?: NotificationSource | string;
  entityId?: string | null;
  recipientUserId?: string | null;
  branchId?: string | null;
  branch_id?: string | null;
}

const VALID_TYPES: string[] = ["info", "warning", "success", "error"];

// Notifications:
// Scoped to specific partner branch or company-wide (branch_id: null for Super Admin broadcast).
// Inserts into notifications table, with automatic fallback to "system"
// if a database check constraint has not yet been migrated for new sources.
export async function notify(entry: NotifyInput): Promise<boolean> {
  try {
    let branchId = entry.branchId !== undefined ? entry.branchId : (entry.branch_id !== undefined ? entry.branch_id : undefined);

    // If branchId is not explicitly provided (undefined), try to look up from session
    if (branchId === undefined) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        if (email) {
          const { data: emp } = await supabase
            .from("employees")
            .select("branch_id")
            .eq("email", email)
            .maybeSingle();
          if (emp?.branch_id) {
            branchId = emp.branch_id;
          }
        }
      } catch {
        // ignore
      }
    }

    const resolvedType = entry.type && VALID_TYPES.includes(entry.type) ? entry.type : "info";
    const resolvedSource = entry.source || "employees";

    const payload = {
      title: entry.title,
      message: entry.message,
      type: resolvedType,
      source: resolvedSource,
      entity_id: entry.entityId ?? null,
      recipient_user_id: entry.recipientUserId ?? null,
      branch_id: branchId ?? null,
    };

    // Primary attempt
    const { error } = await supabase.from("notifications").insert(payload);

    if (!error) {
      return true;
    }

    console.warn("Primary notification insert failed with source:", resolvedSource, error.message);

    // If check constraint failed or source rejected, fallback to "system" (always allowed)
    const fallbackRes = await supabase.from("notifications").insert({
      ...payload,
      source: "system",
      type: "info",
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
