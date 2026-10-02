import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import type { EmployeeType, EmployeeTypeFormState } from "../../types";

interface CreateOrEditEmployeeTypeFormProps {
  editingEmployeeType: EmployeeType | null;
  isReadOnly?: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: EmployeeTypeFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

export function CreateOrEditEmployeeTypeForm({
  editingEmployeeType,
  isReadOnly = false,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditEmployeeTypeFormProps) {
  const [form, setForm] = useState<EmployeeTypeFormState>(() => ({
    name: editingEmployeeType?.name || "",
    status: (editingEmployeeType?.status as "active" | "disabled") || "active",
  }));

  useEffect(() => {
    if (editingEmployeeType) {
      setForm({
        name: editingEmployeeType.name || "",
        status: (editingEmployeeType.status as "active" | "disabled") || "active",
      });
    }
  }, [editingEmployeeType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const title = isReadOnly
    ? `View Employee Type: ${editingEmployeeType?.name || "Employee Type"}`
    : editingEmployeeType
    ? "Edit Employee Type"
    : "Create Employee Type";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {isReadOnly && onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-edit-line text-xs" />
              <span>Edit Employee Type</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {isReadOnly ? (
        /* READ-ONLY VIEW MODE */
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              Employee Type Info
            </h3>
            <div className="flex items-center py-2 text-xs">
              <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                Name
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-normal">
                {editingEmployeeType?.name || form.name || "—"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT FORM MODE */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* EMPLOYEE TYPE INFO */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
              Employee Type Info
            </h3>

            {/* Name */}
            <FormRow label="Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
            </FormRow>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-sm" />
                  <span>Save</span>
                  <i className="ri-arrow-down-s-line text-xs" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-sm" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
