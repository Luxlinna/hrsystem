import { supabase } from "./supabase";

type AuditModule = "hire" | "leave" | "payroll" | "onboarding" | "employees" | "offboard" | "it" | "finance" | "benefits" | "tools" | "unity" | "branches" | "settings";
type AuditAction = "created" | "updated" | "approved" | "rejected" | "deleted" | "processed";

interface LogActivityInput {
  module: AuditModule;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actorName: string;
  actorRole: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Fire-and-forget: an audit trail entry should never block or fail the
// actual user-facing action it's describing.
export function logActivity(entry: LogActivityInput) {
  supabase.from("audit_logs").insert({
    module: entry.module,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    actor_name: entry.actorName,
    actor_role: entry.actorRole,
    description: entry.description,
    metadata: entry.metadata ?? {},
  }).then(({ error }) => {
    if (error) console.error("audit log failed:", error.message);
  });
}
