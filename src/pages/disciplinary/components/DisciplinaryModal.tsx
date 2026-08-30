import React, { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, NewRecord, Branch } from "../types";
import { DisciplinaryScopePicker } from "./DisciplinaryScopePicker";
import { DisciplinaryTypePicker } from "./DisciplinaryTypePicker";
import { DisciplinarySeverityPicker } from "./DisciplinarySeverityPicker";

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className="ri-file-shield-line" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Log Disciplinary Record / PIP
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Document a warning, policy violation, workplace incident, or performance plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
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
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <EmployeeSearchSelect
              employees={employees}
              value={newRecord.employee_id}
              onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
            />
          </div>

          <DisciplinaryTypePicker
            selectedType={newRecord.type}
            onSelectType={(type) => setNewRecord({ ...newRecord, type })}
          />

          <DisciplinarySeverityPicker
            selectedSeverity={newRecord.severity}
            onSelectSeverity={(severity) => setNewRecord({ ...newRecord, severity })}
          />

          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Case Title / Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              placeholder="e.g. Unexcused repeated tardiness, Client protocol breach..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Incident Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newRecord.incident_date}
                onChange={(e) => setNewRecord({ ...newRecord, incident_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Follow-up / Review Target Date
              </label>
              <input
                type="date"
                value={newRecord.follow_up_date}
                onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Incident Details &amp; Summary
            </label>
            <textarea
              rows={3}
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              placeholder="Outline what happened, witnesses, evidence, or previous discussions..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newRecord.employee_id || !newRecord.title.trim()}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Record..." : "Log Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
