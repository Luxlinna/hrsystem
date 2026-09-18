import React, { memo, useCallback } from "react";
import type { Employee, NewRecord, Branch, DisciplinarySeverity } from "../types";
import { DisciplinaryScopePicker } from "./DisciplinaryScopePicker";
import { DisciplinaryTypePicker } from "./DisciplinaryTypePicker";
import { DisciplinarySeverityPicker } from "./DisciplinarySeverityPicker";
import { WarningFileUpload } from "./WarningFileUpload";
import { DisciplinaryEmployeeSection } from "./DisciplinaryEmployeeSection";
import { DisciplinaryFormFields } from "./DisciplinaryFormFields";
import { useDisciplinaryEmployeeFilter } from "../hooks/useDisciplinaryEmployeeFilter";

interface DisciplinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  branches: Branch[];
  isSuperAdmin: boolean;
  activeBranchName?: string;
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DisciplinaryModal = memo(function DisciplinaryModal({
  isOpen,
  onClose,
  employees,
  branches,
  isSuperAdmin,
  activeBranchName,
  newRecord,
  setNewRecord,
  saving,
  onSubmit,
}: DisciplinaryModalProps) {
  const { searchableEmployees, branchHasZeroStaff, selectedBranchName } =
    useDisciplinaryEmployeeFilter({
      employees,
      branches,
      newRecord,
      activeBranchName,
    });

  const selectedEmp = employees.find((e) => e.id === newRecord.employee_id);

  const handleSelectEmployeeId = useCallback(
    (id: string) => {
      setNewRecord((prev) => ({ ...prev, employee_id: id }));
    },
    [setNewRecord]
  );

  const handleSelectType = useCallback(
    (type: string) => {
      setNewRecord((prev) => ({
        ...prev,
        type,
        warning_type: type,
      }));
    },
    [setNewRecord]
  );

  const handleSelectSeverity = useCallback(
    (severity: DisciplinarySeverity) => {
      setNewRecord((prev) => ({ ...prev, severity }));
    },
    [setNewRecord]
  );

  const handleFileChange = useCallback(
    (file: File | null) => {
      setNewRecord((prev) => ({ ...prev, document_file: file }));
    },
    [setNewRecord]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white dark:from-slate-900 dark:to-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className="ri-file-shield-line" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Log Disciplinary Record / Issue Warning
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Issue a formal warning, record corrective action, employee promise, and attach signed documents
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <DisciplinaryScopePicker
            isSuperAdmin={isSuperAdmin}
            activeBranchName={activeBranchName}
            branches={branches}
            newRecord={newRecord}
            setNewRecord={setNewRecord}
          />

          <DisciplinaryEmployeeSection
            searchableEmployees={searchableEmployees}
            employeeId={newRecord.employee_id}
            selectedEmp={selectedEmp}
            branchHasZeroStaff={branchHasZeroStaff}
            selectedBranchName={selectedBranchName}
            onSelectEmployeeId={handleSelectEmployeeId}
          />

          <DisciplinaryTypePicker
            selectedType={newRecord.type}
            onSelectType={handleSelectType}
          />

          <DisciplinarySeverityPicker
            selectedSeverity={newRecord.severity}
            onSelectSeverity={handleSelectSeverity}
          />

          <DisciplinaryFormFields
            newRecord={newRecord}
            setNewRecord={setNewRecord}
          />

          <WarningFileUpload
            documentFile={newRecord.document_file || null}
            onFileChange={handleFileChange}
            existingUrl={newRecord.document_url}
            existingName={newRecord.document_name}
          />

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newRecord.employee_id || !newRecord.title.trim()}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line" />
                  <span>Save Warning Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
