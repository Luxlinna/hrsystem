export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  author_name: string;
  author_role: string;
  pinned: boolean;
  visible_to: string;
  published_at: string;
  urgent_alert_hours: number | null;
  view_count: number;
  created_at: string;
}

export type AnnouncementTabKey = "all" | "urgent" | "pinned" | "policies" | "management";
export type ViewMode = "cards" | "table";
export type ComposerMode = "write" | "preview";

export interface AnnouncementFormState {
  title: string;
  content: string;
  category: string;
  priority: string;
  author_name: string;
  author_role: string;
  pinned: boolean;
  visible_to: string;
  urgent_alert_hours: number;
}
