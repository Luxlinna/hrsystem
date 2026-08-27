export type NotificationType = "info" | "warning" | "success" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  source: string;
  entity_id: string | null;
  recipient_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationGroup {
  label: string;
  items: Notification[];
}

export interface TypeConfigItem {
  icon: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
}
