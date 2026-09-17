import React, { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, NewRecord, Branch } from "../types";
import { DisciplinaryScopePicker } from "./DisciplinaryScopePicker";
import { DisciplinaryTypePicker } from "./DisciplinaryTypePicker";
import { DisciplinarySeverityPicker } from "./DisciplinarySeverityPicker";
import { WarningFileUpload } from "./WarningFileUpload";

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
  const selectedBranchName = branches.find((b) => b.id === newRecord.branch_id)?.name;

  // Dynamically resolve employees according to selected scope
  const { availableEmployees, branchHasZeroStaff } = React.useMemo(() => {
    // If Company-Wide (Admin) scope is selected, show all company employees
    if (newRecord.is_admin_scope) {
      return { availableEmployees: employees, branchHasZeroStaff: false };
    }

    const targetBranchId =
      newRecord.branch_id ||
      branches.find((b) => b.name?.trim().toLowerCase() === activeBranchName?.trim().toLowerCase())?.id ||
      "";

    if (!targetBranchId) {
      return { availableEmployees: employees, branchHasZeroStaff: false };
    }

    // Filter employees strictly to active BU/branch
    const branchSpecific = employees.filter((e) => e.branch_id === targetBranchId);
    if (branchSpecific.length > 0) {
      return { availableEmployees: branchSpecific, branchHasZeroStaff: false };
    }
    return { availableEmployees: employees, branchHasZeroStaff: true };
  }, [employees, newRecord.is_admin_scope, newRecord.branch_id, activeBranchName, branches]);

  const searchableEmployees = React.useMemo(() => {
    return availableEmployees.map((e) => {
      const bName = (e as any).branches?.name || branches.find((b) => b.id === e.branch_id)?.name || null;
      return {
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        employee_id: e.employee_id,
        department: e.department,
        role: e.role,
        avatar_url: e.avatar_url,
        branch_id: e.branch_id,
        branch_name: bName,
      };
    });
  }, [availableEmployees, branches]);

  const selectedEmp = employees.find((e) => e.id === newRecord.employee_id);

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

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
                Select Employee (Search Name or ID) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-gray-400">
                {searchableEmployees.length} available
              </span>
            </div>

            <EmployeeSearchSelect
              employees={searchableEmployees}
              value={newRecord.employee_id}
              onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
              placeholder="Type employee name or ID..."
            />

            {branchHasZeroStaff && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <i className="ri-information-line" />
                <span>{selectedBranchName || "Selected branch"} currently has no assigned staff. Showing all employees.</span>
              </p>
            )}
          </div>

          {selectedEmp && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] font-bold flex items-center justify-center shrink-0">
                  {selectedEmp.avatar_url ? (
                    <img src={selectedEmp.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <span>{selectedEmp.first_name[0]}{selectedEmp.last_name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">
                    {selectedEmp.first_name} {selectedEmp.last_name}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {selectedEmp.role} &bull; {selectedEmp.department}
                  </div>
                </div>
              </div>
              {selectedEmp.employee_id && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 shrink-0">
                  ID: {selectedEmp.employee_id}
                </span>
              )}
            </div>
          )}

          <DisciplinaryTypePicker
            selectedType={newRecord.type}
            onSelectType={(type) =>
              setNewRecord({
                ...newRecord,
                type,
                warning_type: type,
              })
            }
          />

          <DisciplinarySeverityPicker
            selectedSeverity={newRecord.severity}
            onSelectSeverity={(severity) => setNewRecord({ ...newRecord, severity })}
          />

          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Warning Subject / Infraction Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              placeholder="e.g. Unexcused Repeated Tardiness / Policy Non-Compliance..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Warning Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newRecord.warning_date || newRecord.incident_date}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    warning_date: e.target.value,
                    incident_date: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Follow-up / Review Date
              </label>
              <input
                type="date"
                value={newRecord.follow_up_date}
                onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Description of Warning (Infraction &amp; Facts) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              placeholder="Detail the facts of the violation, dates, missed commitments, or policy clauses breached..."
              className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Action to Take (Corrective Measure / Penalty)
              </label>
              <textarea
                rows={2}
                value={newRecord.action_to_take || newRecord.action_taken || ""}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    action_to_take: e.target.value,
                    action_taken: e.target.value,
                  })
                }
                placeholder="e.g. 3-day unpaid suspension, mandatory retraining, formal letter placed in HR file..."
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Employee Promise (Commitment / Rectification Pledge)
              </label>
              <textarea
                rows={2}
                value={newRecord.employee_promise || ""}
                onChange={(e) => setNewRecord({ ...newRecord, employee_promise: e.target.value })}
                placeholder="e.g. Employee pledges to arrive by 8:00 AM every shift and notify supervisor in advance..."
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Remark (Internal HR &amp; Supervisor Notes)
            </label>
            <input
              type="text"
              value={newRecord.remark || newRecord.notes || ""}
              onChange={(e) =>
                setNewRecord({
                  ...newRecord,
                  remark: e.target.value,
                  notes: e.target.value,
                })
              }
              placeholder="e.g. Disciplinary hearing conducted with Department Head present. Signed copy on file."
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Supporting File Upload (Signed Warning Letter / Evidence) */}
          <WarningFileUpload
            documentFile={newRecord.document_file || null}
            onFileChange={(file) => setNewRecord({ ...newRecord, document_file: file })}
            existingUrl={newRecord.document_url}
            existingName={newRecord.document_name}
          />

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

