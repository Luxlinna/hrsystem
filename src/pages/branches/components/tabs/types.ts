export type BranchTabType =
  | "profile"
  | "sites"
  | "departments"
  | "positions"
  | "employee-types"
  | "employee-levels"
  | "contract-types"
  | "schedule"
  | "staff"
  | "all";

export interface TabItem {
  id: BranchTabType;
  label: string;
  shortLabel?: string;
  icon: string;
  count?: number | null;
  description?: string;
  group?: "core" | "structure";
}

export const STRUCTURE_TABS: TabItem[] = [
  {
    id: "departments",
    label: "Departments",
    icon: "ri-node-tree",
    description: "Organizational hierarchy & units",
    group: "structure",
  },
  {
    id: "positions",
    label: "Positions",
    icon: "ri-briefcase-line",
    description: "Job titles & role definitions",
    group: "structure",
  },
  {
    id: "employee-types",
    label: "Employee Types",
    icon: "ri-user-settings-line",
    description: "Full-time, part-time, intern",
    group: "structure",
  },
  {
    id: "employee-levels",
    label: "Employee Levels",
    icon: "ri-stairs-line",
    description: "Career bands & seniority grades",
    group: "structure",
  },
  {
    id: "contract-types",
    label: "Contract Types",
    icon: "ri-file-paper-2-line",
    description: "Permanent, probation, contractor",
    group: "structure",
  },
];
