export interface AuditLogMetadata {
  business_unit?: string;
  target_business_unit?: string;
  is_cross_bu?: boolean;
  old_value?: string | number | null;
  new_value?: string | number | null;
  reason?: string;
  field_changed?: string;
  [key: string]: unknown;
}

export interface AuditLog {
  id: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_name: string;
  actorRole?: string;
  actor_role: string;
  description: string;
  metadata: AuditLogMetadata;
  created_at: string;
  branch_id?: string | null;
  branches?: { id?: string; name: string } | null;
}

export type CrossBuScopeFilter = "all" | "local" | "cross_bu";

export type ExportFormat = "csv" | "xlsx" | "pdf";
