export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
  avatar_url?: string | null;
}

export interface BenefitPlan {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  eligible_count: number;
  description?: string | null;
  coverage_amount?: number | null;
  employee_contribution?: number | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  plan_id: string;
  employee_id: string;
  status: "enrolled" | "opted_out" | string;
  enrolled_date?: string | null;
  created_at?: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
  benefit_plans?: {
    id?: string;
    name: string;
    type: string;
    provider?: string;
    coverage_amount?: number | null;
    employee_contribution?: number | null;
  } | null;
}

export interface PlanFormState {
  name: string;
  provider: string;
  type: string;
  coverage_amount: string;
  employee_contribution: string;
  eligible_count: string;
  status: string;
  description: string;
}

export interface ProviderItem {
  provider: string;
  name?: string;
  plans: BenefitPlan[];
  enrolledCount?: number;
  planCount?: number;
  totalEnrolled?: number;
}

export type BenefitTabKey = "plans" | "enrollment" | "providers" | "nssf";
export type ViewMode = "table" | "cards";

export interface NssfEmployee {
  id: string;
  nssf_number?: string | null;
  first_name: string;
  last_name: string;
  kh_name?: string | null;
  nationality?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  join_date?: string | null;
  basic_salary?: number | null;
  status?: string | null;
  department?: string | null;
  role?: string | null;
  branch?: string | null;
  branch_id?: string | null;
  avatar_url?: string | null;
}
