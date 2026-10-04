export interface UnityApp {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  integration_url: string;
  docs_url: string;
  status: string;
  version: string;
  vendor: string;
  monthly_cost: number;
  created_at: string;
}

export interface AppAccess {
  id: number;
  app_id: number;
  employee_id: string;
  access_level: string;
  granted_at: string;
  granted_by: string;
  is_active: boolean;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

export interface AppUsageLog {
  id: number;
  app_id: number;
  employee_id: string;
  action: string;
  duration_minutes: number;
  logged_at: string;
  unity_apps?: { name: string; icon: string; color: string } | null;
  employees?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
}