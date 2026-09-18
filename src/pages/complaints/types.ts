export type ComplaintType = "complaint" | "suggestion" | "grievance";

export type ComplaintStatus = "pending" | "in_review" | "resolved" | "dismissed";

export interface ComplaintSuggestion {
  id: string;
  branch_id: string;
  employee_id: string | null;
  type: ComplaintType;
  entry_date: string;
  target_to: string;
  subject: string;
  details: string;
  suggestion: string | null;
  remark: string | null;
  status: ComplaintStatus;
  attachment_url: string | null;
  attachment_name: string | null;
  recorded_by: string | null;
  show_identity?: boolean;
  target_category?: string;
  created_at: string;
  updated_at: string;
  // joined relations
  employees?: {
    first_name: string;
    last_name: string;
    role: string | null;
    department: string | null;
    avatar_url: string | null;
  } | null;
  branches?: {
    id: string;
    name: string;
  } | null;
}

export interface ComplaintFormState {
  employee_id: string;
  type: ComplaintType;
  entry_date: string;
  target_to: string;
  target_category?: string;
  show_identity?: boolean;
  subject: string;
  details: string;
  suggestion: string;
  remark: string;
  status: ComplaintStatus;
  attachment_url: string;
  attachment_name: string;
}

export const EMPTY_COMPLAINT_FORM: ComplaintFormState = {
  employee_id: "",
  type: "complaint",
  entry_date: new Date().toISOString().split("T")[0],
  target_to: "",
  target_category: "Business Unit",
  show_identity: true,
  subject: "",
  details: "",
  suggestion: "",
  remark: "",
  status: "pending",
  attachment_url: "",
  attachment_name: "",
};

export interface ComplaintEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  department: string | null;
  avatar_url: string | null;
  branch_id?: string | null;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
}
