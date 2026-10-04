import React, { memo, useState, useCallback } from "react";
import type { Employee, NewRecord, Branch } from "../types";
import { useWarningTypeOptions } from "../hooks/useWarningTypeOptions";
import { WarningEmployeeField } from "./WarningEmployeeField";
import { WarningRichTextFields } from "./WarningRichTextFields";
import { WarningAttachmentField } from "./WarningAttachmentField";

interface CreateEmployeeWarningFormProps {
  onBack: () => void;
  employees: Employee[];
  branches: Branch[];
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
  activeBranchId?: string | null;
}

export const CreateEmployeeWarningForm = memo(function CreateEmployeeWarningForm({
  onBack,
  employees,
  newRecord,
  setNewRecord,
  saving,
  onSubmit,
  activeBranchId,
}: CreateEmployeeWarningFormProps) {
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const { options: warningTypeOptions } = useWarningTypeOptions();

  const handleFieldChange = useCallback(
    (field: keyof NewRecord, value: any) => {
      setNewRecord((prev) => ({ ...prev, [field]: value }));
    },
    [setNewRecord]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 mb-6 sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-xl font-medium text-slate-600 tracking-tight">
          {newRecord.id ? "Edit Employee Warning" : "Create Employee Warning"}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* 1. EMPLOYEE INFO */}
          <WarningEmployeeField
            employees={employees}
            newRecord={newRecord}
            handleFieldChange={handleFieldChange}
            activeBranchId={activeBranchId}
          />

          {/* 2. WARNING INFO */}
          <div className="pt-2">
            <div className="text-sm font-bold text-[#0284c7] uppercase">
              WARNING INFO
            </div>
            <div className="border-b border-slate-200 mt-2 mb-6" />

            {/* Warning Type */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
              <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
                Warning Type <span className="text-rose-500">*</span>
              </label>
              <div className="w-full sm:w-[350px] relative">
                <select
                  required
                  value={newRecord.warning_type || newRecord.type}
                  onChange={(e) => {
                    handleFieldChange("warning_type", e.target.value);
                    handleFieldChange("type", e.target.value);
                    if (!newRecord.title) handleFieldChange("title", `${e.target.value} Notice`);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500 appearance-none pr-8 cursor-pointer"
                >
                  <option value=""></option>
                  {warningTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>
            </div>

            {/* Warning Date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-5">
              <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
                Warning Date <span className="text-rose-500">*</span>
              </label>
              <div className="w-full sm:w-[350px] relative">
                <input
                  type="date"
                  required
                  value={newRecord.warning_date || newRecord.incident_date}
                  onChange={(e) => {
                    handleFieldChange("warning_date", e.target.value);
                    handleFieldChange("incident_date", e.target.value);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Rich text editors & remark */}
            <WarningRichTextFields
              newRecord={newRecord}
              handleFieldChange={handleFieldChange}
            />
          </div>

          {/* 3. ATTACHMENT INFO */}
          <WarningAttachmentField
            newRecord={newRecord}
            handleFieldChange={handleFieldChange}
          />

          {/* Bottom Action Buttons */}
          <div className="pt-4 flex items-center gap-2">
            <div className="relative inline-flex rounded">
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0284c7] hover:bg-sky-700 rounded-l flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <i className="ri-save-line text-sm" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveMenuOpen(!saveMenuOpen)}
                disabled={saving}
                className="px-2 py-1.5 text-xs text-white bg-sky-700 hover:bg-sky-800 rounded-r border-l border-sky-500 cursor-pointer flex items-center"
              >
                <i className="ri-arrow-down-s-fill text-xs" />
              </button>

              {saveMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded shadow-lg py-1 z-20 text-xs">
                  <button
                    type="submit"
                    onClick={() => setSaveMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    Save &amp; Close
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-close-line text-sm" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
