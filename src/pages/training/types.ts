export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  instructor: string | null;
  format: "online" | "in_person" | "hybrid" | "self_paced";
  status: "active" | "draft" | "archived";
  created_at: string;
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
}

export interface CourseFormState {
  title: string;
  description: string;
  category: string;
  duration_hours: string;
  instructor: string;
  format: "online" | "in_person" | "hybrid" | "self_paced";
  status: "active" | "draft" | "archived";
}

export type TrainingTab = "courses" | "enrollments" | "certificates";
