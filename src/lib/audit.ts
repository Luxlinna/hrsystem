import { supabase } from "./supabase";

type AuditModule =
  | "hire"
  | "leave"
  | "payroll"
  | "onboarding"
  | "employees"
  | "offboard"
  | "it"
  | "finance"
  | "benefits"
  | "tools"
  | "unity"
  | "branches"
  | "settings"
  | "meeting_rooms"
  | "documents"
  | "attendance"
  | "performance"
  | "announcements"
  | "disciplinary"
  | "tasks"
  | "shifts"
  | "reports"
  | "training";
type AuditAction = "created" | "updated" | "approved" | "rejected" | "deleted" | "processed" | "cancelled" | "invited" | "exported";

interface LogActivityInput {
  module: AuditModule;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actorName: string;
  actorRole: string;
  description: string;
  metadata?: Record<string, unknown>;
  branchId?: string | null;
  branch_id?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fire-and-forget: an audit trail entry should never block or fail the
// actual user-facing action it's describing.
export function logActivity(entry: LogActivityInput) {
  let resolvedEntityId: string | null = null;
  if (entry.entityId) {
    if (UUID_REGEX.test(entry.entityId)) {
      resolvedEntityId = entry.entityId;
    } else {
      const match = entry.entityId.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      );
      if (match) {
        resolvedEntityId = match[0];
      }
    }
  }

  supabase.from("audit_logs").insert({
    module: entry.module,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: resolvedEntityId,
    actor_name: entry.actorName,
    actor_role: entry.actorRole,
    description: entry.description,
    metadata: entry.metadata ?? {},
    branch_id: entry.branchId ?? entry.branch_id ?? null,
  }).then(({ error }) => {
    if (error) console.error("audit log failed:", error.message);
  });
}
