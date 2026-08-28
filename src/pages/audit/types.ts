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
  metadata: Record<string, unknown>;
  created_at: string;
  branch_id?: string | null;
}

export type ExportFormat = "csv" | "xlsx" | "pdf";
