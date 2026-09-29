import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import type { ContractType, ContractTypeFormState } from "../../types";

interface CreateOrEditContractTypeFormProps {
  editingContractType: ContractType | null;
  isReadOnly?: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: ContractTypeFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

export function CreateOrEditContractTypeForm({
  editingContractType,
  isReadOnly = false,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditContractTypeFormProps) {
  const [form, setForm] = useState<ContractTypeFormState>(() => ({
    name: editingContractType?.name || "",
    term: (editingContractType?.term as "None" | "Probation" | "FDC" | "UDC") || "None",
    period_months: editingContractType?.period_months ? String(editingContractType.period_months) : "",
    alert_days_before: editingContractType?.alert_days_before != null ? String(editingContractType.alert_days_before) : "30",
    template_name: "",
    status: (editingContractType?.status as "active" | "disabled") || "active",
  }));

  useEffect(() => {
    if (editingContractType) {
      setForm({
        name: editingContractType.name || "",
        term: (editingContractType.term as "None" | "Probation" | "FDC" | "UDC") || "None",
        period_months: editingContractType.period_months ? String(editingContractType.period_months) : "",
        alert_days_before: editingContractType.alert_days_before != null ? String(editingContractType.alert_days_before) : "30",
        template_name: "",
        status: (editingContractType.status as "active" | "disabled") || "active",
      });
    }
  }, [editingContractType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const title = isReadOnly
    ? `View Contract Type: ${editingContractType?.name || "Contract Type"}`
    : editingContractType
    ? "Edit Contract Type"
    : "Create Contract Type";

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
              <span>Edit Contract Type</span>
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
              Contract Type Info
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Name
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  {editingContractType?.name || form.name || "—"}
                </span>
              </div>

              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Term
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-900 dark:text-slate-100 font-normal">
                    {editingContractType?.term || form.term}
                  </span>
                  {editingContractType?.period_months && (
                    <span className="text-slate-500">
                      (Period: {editingContractType.period_months} Month(s))
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Alert
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-normal">
                  {editingContractType?.alert_days_before ?? form.alert_days_before} days before ending this contract type.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT FORM MODE */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* CONTRACT TYPE INFO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
              Contract Type Info
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

            {/* Term Radio Buttons */}
            <FormRow label="Term" required>
              <div className="flex items-center gap-6 text-xs text-slate-700 dark:text-slate-200">
                {(["None", "Probation", "FDC", "UDC"] as const).map((t) => (
                  <label key={t} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="term"
                      value={t}
                      checked={form.term === t}
                      onChange={() => setForm((prev) => ({ ...prev, term: t }))}
                      className="w-3.5 h-3.5 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </FormRow>

            {/* Period Months (shown when Probation or FDC is selected) */}
            {(form.term === "FDC" || form.term === "Probation") && (
              <FormRow label="Period (Months)">
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    min="1"
                    value={form.period_months}
                    onChange={(e) => setForm((prev) => ({ ...prev, period_months: e.target.value }))}
                    placeholder={form.term === "Probation" ? "3" : "12"}
                    className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
                  />
                  <span className="text-xs text-slate-500">Month(s)</span>
                </div>
              </FormRow>
            )}

            {/* Alert */}
            <FormRow label="Alert">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="number"
                  min="0"
                  value={form.alert_days_before}
                  onChange={(e) => setForm((prev) => ({ ...prev, alert_days_before: e.target.value }))}
                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] text-center"
                />
                <span>days before ending this contract type.</span>
              </div>
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
