import type { MediaItem } from "@/lib/s3-storage";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  avatar_url?: string;
  email: string;
  role?: string;
  reports_to?: string | null;
  branch_id?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  is_outside_work: boolean;
  work_status: "checked_in" | "checked_out" | null;
  work_checked_in_at: string | null;
  work_checked_out_at: string | null;
  work_lat: number | null;
  work_lng: number | null;
  work_accuracy_m: number | null;
  work_address: string | null;
  work_image_url: string | null;
  work_check_out_lat: number | null;
  work_check_out_lng: number | null;
  work_check_out_accuracy_m: number | null;
  work_check_out_address: string | null;
  work_check_out_image_url: string | null;
  work_media_urls: MediaItem[] | null;
  work_check_out_media_urls: MediaItem[] | null;
  employees?: { first_name: string; last_name: string; department: string; avatar_url?: string } | null;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: "created" | "status_changed" | "assigned" | "updated";
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  employees?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

export interface FormState {
  title: string;
  description: string;
  assigned_to: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string;
  is_outside_work: boolean;
}

export type TaskViewMode = "board" | "list" | "calendar" | "report";
export type TaskSortField = "due_date" | "priority" | "created_at" | "title";
export type TaskSortOrder = "asc" | "desc";
