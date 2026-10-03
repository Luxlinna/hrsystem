import React from "react";
import type { MovementFormData } from "../types";
import { useMovementFormState } from "./useMovementFormState";
import { MovementModalEmployeeStep } from "./MovementModalEmployeeStep";
import { MovementFormFields } from "@/features/workforce/employees/components/overview/movements/MovementFormFields";

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
  onSave,
  preselectedEmployeeId,
  defaultBranchId,
}) => {
  const state = useMovementFormState({
    open,
    employees,
    branches,
    onSave,
    onClose,
    preselectedEmployeeId,
    defaultBranchId,
  });

  if (!open) return null;

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
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={state.handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {state.errorMsg && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
              <i className="ri-error-warning-line text-base" />
              <span>{state.errorMsg}</span>
            </div>
          )}

          {/* 1. Search Employee Name or ID */}
          <MovementModalEmployeeStep
            modalBranchId={state.modalBranchId}
            setModalBranchId={state.setModalBranchId}
            branches={branches}
            employees={employees}
            searchableEmployees={state.searchableEmployees}
            selectedEmployeeId={state.selectedEmployeeId}
            onSelectEmployee={(id) => {
              state.setSelectedEmployeeId(id);
              state.setErrorMsg(null);
            }}
            selectedEmployee={state.selectedEmployee}
            selectedEmployeeBranchName={state.selectedEmployeeBranchName}
          />

          {/* 2. Unified Information Structure Form */}
          {state.selectedEmployee && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <MovementFormFields
                values={state.unifiedValues}
                onChange={state.handleUnifiedChange}
                file={state.documentFile}
                onFileChange={state.setDocumentFile}
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={state.submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={state.submitting || !state.selectedEmployee}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#253C7D] hover:bg-[#1e3064] text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {state.submitting ? (
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
