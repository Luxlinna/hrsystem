import React, { useState, useEffect } from "react";
import type { EmployeeLevel, EmployeeLevelFormState } from "../../types";

interface EmployeeLevelModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  employeeLevel: EmployeeLevel | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: EmployeeLevelFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

export function EmployeeLevelModal({
  isOpen,
  mode,
  employeeLevel,
  saving,
  onClose,
  onSave,
  onSwitchToEdit,
}: EmployeeLevelModalProps) {
  const [form, setForm] = useState<EmployeeLevelFormState>({
    name: "",
    remark: "",
    status: "active",
  });

  useEffect(() => {
    if (employeeLevel) {
      setForm({
        name: employeeLevel.name || "",
        remark: employeeLevel.remark || "",
        status: (employeeLevel.status as "active" | "disabled") || "active",
      });
    } else {
      setForm({
        name: "",
        remark: "",
        status: "active",
      });
    }
  }, [employeeLevel, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
            Employee Level
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {isReadOnly ? (
          /* READ-ONLY VIEW MODE */
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center py-1">
              <span className="w-40 text-slate-600 dark:text-slate-400 font-normal">
                Employee level name
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {employeeLevel?.name || form.name || "—"}
              </span>
            </div>

            <div className="flex items-start py-1">
              <span className="w-40 text-slate-600 dark:text-slate-400 font-normal pt-0.5">
                Remark
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-normal whitespace-pre-wrap flex-1">
                {employeeLevel?.remark || form.remark || "—"}
              </span>
            </div>

            <div className="flex items-center py-1">
              <span className="w-40 text-slate-600 dark:text-slate-400 font-normal">
                Status
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                  employeeLevel?.status === "disabled"
                    ? "bg-[#f0ad4e] text-white"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                }`}
              >
                {employeeLevel?.status === "disabled" ? "Disabled" : "Active"}
              </span>
            </div>

            {/* Bottom Actions for View Mode */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {onSwitchToEdit && (
                <button
                  type="button"
                  onClick={onSwitchToEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
                >
                  <i className="ri-edit-line text-xs" />
                  <span>Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded cursor-pointer transition-colors"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        ) : (
          /* CREATE / EDIT FORM MODE */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Employee level name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <label className="w-full sm:w-36 text-slate-700 dark:text-slate-300 font-normal">
                Employee level name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Employee level name"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
            </div>

            {/* Remark */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 text-xs">
              <label className="w-full sm:w-36 text-slate-700 dark:text-slate-300 font-normal pt-1.5">
                Remark
              </label>
              <textarea
                rows={3}
                value={form.remark}
                onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
                placeholder="Remark"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] resize-none"
              />
            </div>

            {/* Bottom Actions matching screenshot: [ Done ] [ Cancel ] */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line text-sm" />
                    <span>Done</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-sm" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
