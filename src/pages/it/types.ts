export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface ITAsset {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  employee_id: string | null;
  branch_id: string | null;
  status: "active" | "inventory" | "maintenance" | "retired" | string;
  serial_number: string | null;
  created_at?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    department?: string;
    avatar_url?: string | null;
  } | null;
  branches?: { id?: string; name: string } | null;
}

export interface ITTicket {
  id: string;
  title: string;
  requester_name: string;
  priority: "low" | "medium" | "high" | "critical" | string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  category: string;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AssetFormState {
  name: string;
  asset_tag: string;
  type: string;
  serial_number: string;
  branch_id: string;
  employee_id: string;
  status: string;
}

export interface TicketFormState {
  title: string;
  requester_name: string;
  priority: string;
  category: string;
  description: string;
}
