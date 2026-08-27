// Shared interfaces for the TopBar component tree.
// Kept in a dedicated file so every sub-component imports from a single source
// of truth rather than duplicating definitions.

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  source: string;
  entity_id: string | null;
  recipient_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  path: string;
  category: string;
}
