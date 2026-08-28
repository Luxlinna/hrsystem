export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  reports_to: string | null;
  status: string;
  branch_id?: string | null;
  email?: string;
  phone?: string;
  branches?: { id?: string; name: string } | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface TreeNode extends Employee {
  children: TreeNode[];
  depth: number;
  expanded: boolean;
}

export type OrgChartViewMode = "tree" | "departments" | "list";
