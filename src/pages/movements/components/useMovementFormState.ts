import { useState, useEffect, useMemo } from "react";
import type { MovementFormData, MovementType } from "../types";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { MovementFormValues } from "@/pages/employees/components/overview/movements/MovementFormFields";

interface BranchOption {
  id: string;
  name: string;
}

interface UseMovementFormStateParams {
  open: boolean;
  employees: any[];
  branches: BranchOption[];
  onSave: (form: MovementFormData, employee: any) => Promise<void>;
  onClose: () => void;
  preselectedEmployeeId?: string;
  defaultBranchId?: string;
}

function inferMovementType(title: string): MovementType {
  const t = title.toLowerCase();
  if (t.includes("promot")) return "promote";
  if (t.includes("transfer") || t.includes("branch") || t.includes("site")) return "transfer";
  if (t.includes("salary") || t.includes("wage") || t.includes("compensation")) return "salary_adjustment";
  if (t.includes("pass") || t.includes("probation")) return "pass_probation";
  if (t.includes("contract") || t.includes("renew") || t.includes("extend")) return "change_contract";
  if (t.includes("demot")) return "demote";
  return "transfer";
}

const DEFAULT_FORM: MovementFormValues = {
  title: "Promotion",
  effectiveDate: new Date().toISOString().split("T")[0],
  site: "",
  department: "",
  designation: "",
  contractType: "Standard Contract",
  contractStartDate: "",
  contractEndDate: "",
  employeeType: "FULL-TIME",
  supervisor: "",
  salary: "",
  salaryFreq: "Monthly",
  salaryAfter: "",
  salaryAfterFreq: "Monthly",
  remarks: "",
};

export function useMovementFormState({
  open,
  employees,
  branches,
  onSave,
  onClose,
  preselectedEmployeeId,
  defaultBranchId,
}: UseMovementFormStateParams) {
  const [modalBranchId, setModalBranchId] = useState<string>(defaultBranchId || "all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unifiedValues, setUnifiedValues] = useState<MovementFormValues>(DEFAULT_FORM);

  useEffect(() => {
    if (defaultBranchId) setModalBranchId(defaultBranchId);
  }, [defaultBranchId, open]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || null;
  const selectedEmployeeBranchName =
    selectedEmployee?.branches?.name ||
    branches.find((b) => b.id === selectedEmployee?.branch_id)?.name || null;

  useEffect(() => {
    if (selectedEmployee) {
      setUnifiedValues({
        title: "Promotion",
        effectiveDate: new Date().toISOString().split("T")[0],
        site: selectedEmployee.site || selectedEmployee.code_bu || selectedEmployeeBranchName || "",
        department: selectedEmployee.department || "",
        designation: selectedEmployee.role || selectedEmployee.position || "",
        contractType: selectedEmployee.contract_type || "Standard Contract",
        contractStartDate: selectedEmployee.contract_effective_date || selectedEmployee.join_date || "",
        contractEndDate: selectedEmployee.contract_end_date || selectedEmployee.fdc_end_date || "",
        employeeType: selectedEmployee.employment_type || "FULL-TIME",
        supervisor: selectedEmployee.line_manager || "",
        salary: selectedEmployee.basic_salary != null ? String(selectedEmployee.basic_salary) : (selectedEmployee.contract_rate != null ? String(selectedEmployee.contract_rate) : ""),
        salaryFreq: selectedEmployee.contract_rate_frequency || "Monthly",
        salaryAfter: selectedEmployee.contract_rate_after != null ? String(selectedEmployee.contract_rate_after) : "",
        salaryAfterFreq: selectedEmployee.contract_rate_after_frequency || "Monthly",
        remarks: "",
      });
      setDocumentFile(null);
    }
  }, [selectedEmployee, selectedEmployeeBranchName]);

  const handleUnifiedChange = (field: keyof MovementFormValues, val: string) => {
    setUnifiedValues((prev) => ({ ...prev, [field]: val }));
  };

  const filteredEmployeesByBranch = useMemo(() => {
    if (!modalBranchId || modalBranchId === "all") return employees;
    return employees.filter((e) => e.branch_id === modalBranchId);
  }, [employees, modalBranchId]);

  const searchableEmployees: SearchableEmployee[] = useMemo(() => {
    return filteredEmployeesByBranch.map((e) => ({
      id: e.id,
      first_name: e.first_name,
      last_name: e.last_name,
      role: e.role,
      department: e.department,
      avatar_url: e.avatar_url,
      branch_id: e.branch_id,
      branch_name: e.branches?.name || branches.find((b) => b.id === e.branch_id)?.name || null,
    }));
  }, [filteredEmployeesByBranch, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setErrorMsg("Please search and select an employee first.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    const formData: MovementFormData = {
      employee_id: selectedEmployee.id,
      movement_type: inferMovementType(unifiedValues.title),
      title: unifiedValues.title,
      effective_date: unifiedValues.effectiveDate,
      remarks: unifiedValues.remarks,
      document_file: documentFile,
      site: unifiedValues.site,
      department: unifiedValues.department,
      designation: unifiedValues.designation,
      contract_type: unifiedValues.contractType,
      contract_start_date: unifiedValues.contractStartDate,
      contract_end_date: unifiedValues.contractEndDate,
      employee_type: unifiedValues.employeeType,
      supervisor: unifiedValues.supervisor,
      salary: unifiedValues.salary ? parseFloat(unifiedValues.salary) : undefined,
      salary_freq: unifiedValues.salaryFreq,
      salary_after: unifiedValues.salaryAfter ? parseFloat(unifiedValues.salaryAfter) : undefined,
      salary_after_freq: unifiedValues.salaryAfterFreq,
    };

    try {
      await onSave(formData, selectedEmployee);
      onClose();
    } catch (err: any) {
      console.error("Movement save failed:", err);
      setErrorMsg(err?.message || "Failed to record movement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    modalBranchId, setModalBranchId,
    selectedEmployeeId, setSelectedEmployeeId,
    documentFile, setDocumentFile,
    submitting, errorMsg, setErrorMsg,
    selectedEmployee, selectedEmployeeBranchName,
    searchableEmployees, handleSubmit,
    unifiedValues, handleUnifiedChange,
  };
}
