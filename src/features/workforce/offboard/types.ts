export interface Offboarding {
  id: string;
  employee_id: string;
  last_day: string;
  reason: string;
  status: string;
  created_at: string;
  notes?: string | null;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department?: string;
    branch_id?: string;
    avatar_url?: string | null;
    branches?: { id: string; name: string } | null;
  } | null;
  tasks?: OffboardingTask[];
}

export interface OffboardingTask {
  id: string;
  offboarding_id: string;
  title: string;
  type: string;
  assignee: string;
  status: string;
  due_date: string | null;
  notes?: string | null;
}

export interface EnrichedOffboardingTask extends OffboardingTask {
  offboardingStatus: string;
  employeeName: string;
  employeeRole: string;
  employeeDept: string;
  employeeAvatar?: string | null;
  last_day: string;
}

export interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  avatar_url?: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface CreateOffboardingForm {
  employee_id: string;
  last_day: string;
  reason: string;
  notes: string;
  includeDefaultTasks: boolean;
}

export interface AddTaskForm {
  title: string;
  type: string;
  assignee: string;
  due_date: string;
}

export interface EditOffboardingForm {
  last_day: string;
  reason: string;
  notes: string;
  status: string;
}
