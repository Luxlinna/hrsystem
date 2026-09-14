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

export interface LogActivityInput {
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
  businessUnit?: string | null;
  business_unit?: string | null;
  targetBusinessUnit?: string | null;
  target_business_unit?: string | null;
  isCrossBu?: boolean;
  is_cross_bu?: boolean;
  oldValue?: string | number | null;
  old_value?: string | number | null;
  newValue?: string | number | null;
  new_value?: string | number | null;
  reason?: string | null;
  fieldChanged?: string | null;
  field_changed?: string | null;
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

  const rawBranchId = entry.branchId ?? entry.branch_id ?? null;
  const resolvedBranchId = rawBranchId && UUID_REGEX.test(rawBranchId) ? rawBranchId : null;

  const bu = entry.businessUnit ?? entry.business_unit ?? null;
  const targetBu = entry.targetBusinessUnit ?? entry.target_business_unit ?? null;
  const isCross = Boolean(entry.isCrossBu ?? entry.is_cross_bu ?? (bu && targetBu && bu !== targetBu));
  const oldVal = entry.oldValue ?? entry.old_value ?? null;
  const newVal = entry.newValue ?? entry.new_value ?? null;
  const rsn = entry.reason ?? null;
  const fld = entry.fieldChanged ?? entry.field_changed ?? null;

  const enrichedMetadata: Record<string, unknown> = {
    ...(entry.metadata ?? {}),
    ...(bu ? { business_unit: bu } : {}),
    ...(targetBu ? { target_business_unit: targetBu } : {}),
    ...(isCross ? { is_cross_bu: true } : {}),
    ...(oldVal !== null ? { old_value: oldVal } : {}),
    ...(newVal !== null ? { new_value: newVal } : {}),
    ...(rsn ? { reason: rsn } : {}),
    ...(fld ? { field_changed: fld } : {}),
  };

  supabase.from("audit_logs").insert({
    module: entry.module,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: resolvedEntityId,
    actor_name: entry.actorName,
    actor_role: entry.actorRole,
    description: entry.description,
    metadata: enrichedMetadata,
    branch_id: resolvedBranchId,
  }).then(({ error }) => {
    if (error) console.error("audit log failed:", error.message);
  });
}
