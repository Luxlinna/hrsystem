import React, { useState } from "react";
import EmployeeSearchSelect, { type SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { MovementType, MovementFormData } from "../types";
import { MOVEMENT_TYPES, CONTRACT_TYPES, SALARY_ADJUSTMENT_REASONS } from "../constants";
import {
  SelectedEmployeeSnapshot,
  MovementTypeSelector,
  ProbationFields,
  PassProbationFields,
  TransferFields,
  PromoteFields,
  DemoteFields,
  SalaryAdjustmentFields,
  ChangeContractFields,
  MovementFileUpload,
} from "./movement-forms";

interface BranchOption {
  id: string;
  name: string;
}

interface WorkLocationOption {
  id: string;
  name: string;
  branch_id?: string;
}

interface MovementModalProps {
  open: boolean;
  onClose: () => void;
  employees: any[];
  branches: BranchOption[];
  workLocations?: WorkLocationOption[];
  onSave: (form: MovementFormData, employee: any) => Promise<void>;
  preselectedEmployeeId?: string;
  defaultBranchId?: string;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  open,
  onClose,
  employees,
  branches,
  workLocations = [],
  onSave,
  preselectedEmployeeId,
  defaultBranchId,
}) => {
  const [modalBranchId, setModalBranchId] = useState<string>(defaultBranchId || "all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || "");
  const [movementType, setMovementType] = useState<MovementType>("promote");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync modal branch filter with active BU
  React.useEffect(() => {
    if (defaultBranchId) {
      setModalBranchId(defaultBranchId);
    }
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
  const [contractStartDate, setContractStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState<string>("");

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || null;
  const selectedEmployeeBranchName =
    selectedEmployee?.branches?.name ||
    branches.find((b) => b.id === selectedEmployee?.branch_id)?.name ||
    null;

  // Filter employees strictly by active BU if selected
  const filteredEmployeesByBranch = React.useMemo(() => {
    if (!modalBranchId || modalBranchId === "all") return employees;
    return employees.filter((e) => e.branch_id === modalBranchId);
  }, [employees, modalBranchId]);

  const searchableEmployees: SearchableEmployee[] = React.useMemo(() => {
    return filteredEmployeesByBranch.map((e) => {
      const bName = e.branches?.name || branches.find((b) => b.id === e.branch_id)?.name || null;
      return {
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        role: e.role,
        department: e.department,
        avatar_url: e.avatar_url,
        branch_id: e.branch_id,
        branch_name: bName,
      };
    });
  }, [filteredEmployeesByBranch, branches]);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center font-bold">
              <i className="ri-route-line text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Record Employee Movement
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Log personnel transitions, transfers, salary updates, and contracts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
              <i className="ri-error-warning-line text-base" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Search Employee Name or ID */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                1. Search Employee Name or ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">BU Scope:</span>
                <select
                  value={modalBranchId}
                  onChange={(e) => {
                    setModalBranchId(e.target.value);
                    setSelectedEmployeeId("");
                  }}
                  className="px-2 py-0.5 text-xs font-bold rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-[#253C7D] dark:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
                >
                  <option value="all">All BUs ({employees.length} staff)</option>
                  {branches.map((b) => {
                    const count = employees.filter((e) => e.branch_id === b.id).length;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} ({count} staff)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <EmployeeSearchSelect
              employees={searchableEmployees}
              value={selectedEmployeeId}
              onChange={(id) => {
                setSelectedEmployeeId(id);
                setErrorMsg(null);
              }}
              placeholder={
                modalBranchId !== "all"
                  ? `Search ${branches.find((b) => b.id === modalBranchId)?.name || "BU"} staff...`
                  : "Type staff name, ID, department, or role..."
              }
            />
            <SelectedEmployeeSnapshot
              employee={selectedEmployee}
              branchName={selectedEmployeeBranchName}
            />
          </div>

          {/* 2. Choose 1 of 7 Movement Types */}
          <MovementTypeSelector selectedType={movementType} onChange={setMovementType} />

          {/* 3. Contextual Action Fields */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
              <i className={MOVEMENT_TYPES[movementType].icon} />
              <span>{MOVEMENT_TYPES[movementType].label} Specifics</span>
            </div>

            {movementType === "probation" && (
              <ProbationFields
                probationMonths={probationMonths}
                onMonthsChange={setProbationMonths}
                probationEndDate={probationEndDate}
                onEndDateChange={setProbationEndDate}
              />
            )}
            {movementType === "pass_probation" && (
              <PassProbationFields
                rating={rating}
                onRatingChange={setRating}
                confirmedRole={confirmedRole}
                onConfirmedRoleChange={setConfirmedRole}
                defaultRole={selectedEmployee?.role}
              />
            )}
            {movementType === "transfer" && (
              <TransferFields
                targetBranchId={targetBranchId}
                onTargetBranchIdChange={setTargetBranchId}
                targetWorkLocationId={targetWorkLocationId}
                onTargetWorkLocationIdChange={setTargetWorkLocationId}
                targetDepartment={targetDepartment}
                onTargetDepartmentChange={setTargetDepartment}
                branches={branches}
                workLocations={workLocations}
                defaultDepartment={selectedEmployee?.department}
              />
            )}
            {movementType === "promote" && (
              <PromoteFields
                currentBranchName={selectedEmployeeBranchName}
                currentRole={selectedEmployee?.role}
                currentDepartment={selectedEmployee?.department}
                newRole={newRole}
                onNewRoleChange={setNewRole}
                newGrade={newGrade}
                onNewGradeChange={setNewGrade}
                salaryIncrease={salaryIncrease}
                onSalaryIncreaseChange={setSalaryIncrease}
              />
            )}
            {movementType === "demote" && (
              <DemoteFields
                demoteRole={demoteRole}
                onDemoteRoleChange={setDemoteRole}
                demoteReason={demoteReason}
                onDemoteReasonChange={setDemoteReason}
              />
            )}
            {movementType === "salary_adjustment" && (
              <SalaryAdjustmentFields
                adjustmentType={adjustmentType}
                onAdjustmentTypeChange={setAdjustmentType}
                currentSalary={currentSalary}
                onCurrentSalaryChange={setCurrentSalary}
                newSalary={newSalary}
                onNewSalaryChange={setNewSalary}
                currency={currency}
              />
            )}
            {movementType === "change_contract" && (
              <ChangeContractFields
                contractType={contractType}
                onContractTypeChange={setContractType}
                contractStartDate={contractStartDate}
                onContractStartDateChange={setContractStartDate}
                contractEndDate={contractEndDate}
                onContractEndDateChange={setContractEndDate}
              />
            )}
          </div>

          {/* 4. Supporting Document Upload */}
          <MovementFileUpload documentFile={documentFile} onFileChange={setDocumentFile} />

          {/* 5. Effective Date & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Effective Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Remarks / Justification
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Official reason or board memo reference..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedEmployee}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#253C7D] hover:bg-[#1e3064] text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line" />
                  <span>Save Movement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
