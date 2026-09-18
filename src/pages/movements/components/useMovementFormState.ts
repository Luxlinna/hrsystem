import { useState, useEffect, useMemo } from "react";
import type { MovementType, MovementFormData } from "../types";
import { SALARY_ADJUSTMENT_REASONS, CONTRACT_TYPES } from "../constants";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";

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
  const [movementType, setMovementType] = useState<MovementType>("promote");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync modal branch filter with active BU
  useEffect(() => {
    if (defaultBranchId) setModalBranchId(defaultBranchId);
  }, [defaultBranchId, open]);

  // Type-specific field states
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [probationEndDate, setProbationEndDate] = useState<string>("");
  const [rating, setRating] = useState<string>("Exceeds Expectations (4.8/5)");
  const [confirmedRole, setConfirmedRole] = useState<string>("");
  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const [targetWorkLocationId, setTargetWorkLocationId] = useState<string>("");
  const [targetDepartment, setTargetDepartment] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [newGrade, setNewGrade] = useState<string>("L3 - Senior");
  const [salaryIncrease, setSalaryIncrease] = useState<string>("");
  const [demoteRole, setDemoteRole] = useState<string>("");
  const [demoteReason, setDemoteReason] = useState<string>("");
  const [currentSalary, setCurrentSalary] = useState<string>("800");
  const [newSalary, setNewSalary] = useState<string>("1000");
  const [currency] = useState<string>("USD");
  const [adjustmentType, setAdjustmentType] = useState<string>(SALARY_ADJUSTMENT_REASONS[0]);
  const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[1]);
  const [contractStartDate, setContractStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [contractEndDate, setContractEndDate] = useState<string>("");

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || null;
  const selectedEmployeeBranchName =
    selectedEmployee?.branches?.name ||
    branches.find((b) => b.id === selectedEmployee?.branch_id)?.name || null;

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
      movement_type: movementType,
      effective_date: effectiveDate,
      remarks,
      document_file: documentFile,
      probation_months: probationMonths,
      probation_end_date: probationEndDate,
      rating,
      confirmed_role: confirmedRole || selectedEmployee.role,
      target_branch_id: targetBranchId,
      target_work_location_id: targetWorkLocationId,
      target_department: targetDepartment || selectedEmployee.department,
      new_role: newRole,
      new_grade: newGrade,
      salary_increase: salaryIncrease ? parseFloat(salaryIncrease) : undefined,
      demote_new_role: demoteRole,
      demote_reason: demoteReason,
      current_salary: currentSalary ? parseFloat(currentSalary) : undefined,
      new_salary: newSalary ? parseFloat(newSalary) : undefined,
      currency,
      adjustment_type: adjustmentType,
      contract_type: contractType,
      contract_start_date: contractStartDate,
      contract_end_date: contractEndDate,
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
    movementType, setMovementType,
    effectiveDate, setEffectiveDate,
    remarks, setRemarks,
    documentFile, setDocumentFile,
    submitting, errorMsg, setErrorMsg,
    selectedEmployee, selectedEmployeeBranchName,
    searchableEmployees, handleSubmit,
    // Contextual fields
    probationMonths, setProbationMonths,
    probationEndDate, setProbationEndDate,
    rating, setRating,
    confirmedRole, setConfirmedRole,
    targetBranchId, setTargetBranchId,
    targetWorkLocationId, setTargetWorkLocationId,
    targetDepartment, setTargetDepartment,
    newRole, setNewRole,
    newGrade, setNewGrade,
    salaryIncrease, setSalaryIncrease,
    demoteRole, setDemoteRole,
    demoteReason, setDemoteReason,
    currentSalary, setCurrentSalary,
    newSalary, setNewSalary,
    currency,
    adjustmentType, setAdjustmentType,
    contractType, setContractType,
    contractStartDate, setContractStartDate,
    contractEndDate, setContractEndDate,
  };
}
