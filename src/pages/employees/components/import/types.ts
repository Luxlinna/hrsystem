import type { Branch } from "../../types";

export interface ImportEmployeesModalProps {
  isOpen: boolean;
  branches: Branch[];
  actorName?: string;
  roleName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ParsedEmployeeRow {
  rowNumber: number;
  fullName: string;
  khName?: string;
  gender: string;
  title?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  employmentType?: string;
  joinDate?: string;
  contractType?: string;
  basicSalary?: number | null;
  buName?: string;
  siteName?: string;
  nationalId?: string;
  dob?: string;
  currentAddress?: string;
  isValid: boolean;
  errors: string[];
}

export const TEMPLATE_HEADERS = [
  "Full Name",
  "Khmer Name",
  "Gender (Male/Female)",
  "Title (Mr/Mrs/Ms)",
  "Phone Number",
  "Email",
  "Business Unit / BU",
  "Site / Work Location",
  "Department",
  "Position",
  "Employment Type",
  "Joining Date (YYYY-MM-DD)",
  "Contract Type",
  "Basic Salary (USD)",
  "National ID",
  "Date of Birth (YYYY-MM-DD)",
  "Current Address",
];
