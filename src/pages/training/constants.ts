import type { CourseFormState } from "./types";

export const FORMAT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  online: { label: "Online", color: "bg-sky-100 text-sky-700", icon: "ri-global-line" },
  in_person: { label: "In Person", color: "bg-emerald-100 text-emerald-700", icon: "ri-building-3-line" },
  hybrid: { label: "Hybrid", color: "bg-violet-100 text-violet-700", icon: "ri-link-m" },
  self_paced: { label: "Self-Paced", color: "bg-amber-100 text-amber-700", icon: "ri-time-line" },
};

export const ENROLL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  enrolled: { label: "Enrolled", color: "bg-sky-100 text-sky-700" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-600" },
  dropped: { label: "Dropped", color: "bg-gray-100 text-gray-500" },
};

export const emptyCourseForm: CourseFormState = {
  title: "",
  description: "",
  category: "General",
  duration_hours: "",
  instructor: "",
  format: "in_person",
  status: "active",
  branch_id: "",
  is_admin_course: false,
  scheduled_date: new Date().toISOString().slice(0, 10),
  start_time: "09:00",
  end_time: "11:00",
  location: "",
  invited_employee_ids: [],
};

