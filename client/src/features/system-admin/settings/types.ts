export interface Branch {
  id: string;
  name: string;
  location: string;
  employee_count: number;
  status: string;
}

export interface AppRole {
  id: number;
  name: string;
  is_admin: boolean;
  allowed_modules: string[];
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  updated_at: string;
}
