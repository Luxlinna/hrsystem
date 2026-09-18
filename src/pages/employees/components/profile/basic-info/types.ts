import type { Employee, ReportEntry } from "../../../types";

export interface BasicInfoSectionProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
}

export interface BasicInfoOrgProps extends BasicInfoSectionProps {
  manager: ReportEntry | null;
  allEmployees: ReportEntry[];
  branches?: { id: string; name: string }[];
  workSites?: { id: string; name: string; branch_id: string }[];
}
