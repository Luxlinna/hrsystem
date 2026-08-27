export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  reports_to: string | null;
  status: string;
  branches?: { name: string } | null;
}

export interface TreeNode extends Employee {
  children: TreeNode[];
  depth: number;
  expanded: boolean;
}
