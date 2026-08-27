export interface Branch {
  id: string;
  name: string;
}

export type ExpenseStatus = "pending" | "approved" | "paid" | "rejected";

export interface Expense {
  id: string;
  category: string;
  branch_id: string | null;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description: string | null;
  submitted_by: string | null;
  created_at?: string;
  branches?: { id?: string; name: string } | null;
}

export interface ExpenseFormState {
  category: string;
  branch_id: string;
  amount: string;
  date: string;
  description: string;
  submitted_by: string;
}

export type DatePreset =
  | "all"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export type ViewMode = "table" | "cards";

export interface CategoryChartItem {
  name: string;
  value: number;
  fill: string;
}

export interface MonthlyTimelineItem {
  month: string;
  total: number;
  paid: number;
}
