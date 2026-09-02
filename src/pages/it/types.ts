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
  branch_id?: string | null;
  created_at: string;
  resolved_at: string | null;
  branches?: { id?: string; name: string } | null;
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
  branch_id?: string;
}

export type ITTabType = "assets" | "tickets" | "security" | "stationery";

export interface StationeryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  unit_cost?: number | null;
  location?: string | null;
  branch_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StationeryRequest {
  id: string;
  item_id: string;
  item_name: string;
  requested_by_id?: string | null;
  requested_by_name: string;
  department: string;
  quantity: number;
  purpose?: string | null;
  status: "pending" | "approved" | "rejected" | "issued";
  urgency: "normal" | "urgent";
  branch_id?: string | null;
  created_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
}

export interface StationeryItemFormState {
  name: string;
  category: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  unit_cost: number | "";
  location: string;
  branch_id: string;
}

export interface StationeryRequestFormState {
  item_id: string;
  requested_by_name: string;
  department: string;
  quantity: number;
  purpose: string;
  urgency: "normal" | "urgent";
  branch_id: string;
}
