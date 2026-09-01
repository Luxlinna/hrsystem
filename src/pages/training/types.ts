export interface Branch {
  id: string;
  name: string;
}

export interface MeetingRoomOption {
  id: string;
  name: string;
  capacity?: number | null;
  floor?: number;
  color?: string;
  branch_id?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  instructor: string | null;
  format: "online" | "in_person" | "hybrid" | "self_paced";
  status: "active" | "draft" | "archived";
  branch_id?: string | null;
  is_admin_course?: boolean;
  scheduled_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  created_by_name?: string | null;
  created_at: string;
  branches?: { id?: string; name: string } | null;
}

export interface Enrollment {
  id: string;
  course_id: string;
  employee_id: string;
  status: "enrolled" | "in_progress" | "completed" | "failed" | "dropped";
  progress: number;
  score: number | null;
  enrolled_at: string;
  due_date: string | null;
  completed_at: string | null;
  certificate_issued: boolean;
  notes: string | null;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    department: string;
    avatar_url: string | null;
    branch_id?: string | null;
  };
  training_courses?: Course;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  avatar_url: string | null;
  branch_id?: string | null;
}

export interface CourseFormState {
  title: string;
  description: string;
  category: string;
  duration_hours: string;
  instructor: string;
  format: "online" | "in_person" | "hybrid" | "self_paced";
  status: "active" | "draft" | "archived";
  branch_id: string;
  is_admin_course: boolean;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location: string;
  invited_employee_ids: string[];
}

export type TrainingTab = "courses" | "calendar" | "enrollments" | "certificates";
