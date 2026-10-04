import React, { memo } from "react";
import type { ComplaintFormState } from "../types";

interface ComplaintRecipientFieldProps {
  form: ComplaintFormState;
  updateField: <K extends keyof ComplaintFormState>(field: K, value: ComplaintFormState[K]) => void;
  branchName?: string | null;
  buDepartments: string[];
  buEmployees: { id: string; name: string; dept: string }[];
  onCategoryChange: (cat: string) => void;
  onEmployeeSelect: (val: string) => void;
}

export const ComplaintRecipientField = memo(function ComplaintRecipientField({
  form,
  updateField,
  branchName,
  buDepartments,
  buEmployees,
  onCategoryChange,
  onEmployeeSelect,
}: ComplaintRecipientFieldProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
      <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
        Complaint/Suggestion To <span className="text-rose-500">*</span>
      </label>
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center border border-slate-300 rounded overflow-hidden bg-white focus-within:border-sky-500">
          <select
            value={form.target_category || "Business Unit"}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border-r border-slate-300 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Business Unit">Business Unit ({branchName || "My BU"})</option>
            <option value="Department">Department</option>
            <option value="Employee">Employee</option>
          </select>

          {form.target_category === "Department" ? (
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                required
                list="bu-departments-list"
                placeholder={`Select or search department in ${branchName || "BU"}...`}
                value={form.target_to}
                onChange={(e) => updateField("target_to", e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none pr-8"
              />
              <datalist id="bu-departments-list">
                {buDepartments.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
              <i className="ri-arrow-down-s-line absolute right-2.5 text-slate-400 text-xs pointer-events-none" />
            </div>
          ) : form.target_category === "Employee" ? (
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                required
                list="bu-employees-list"
                placeholder={
                  buEmployees.length > 0
                    ? `Search employee in ${branchName || "BU"}...`
                    : `No employees registered in ${branchName || "BU"} yet`
                }
                value={form.target_to}
                onChange={(e) => onEmployeeSelect(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none pr-8"
              />
              <datalist id="bu-employees-list">
                {buEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.dept})
                  </option>
                ))}
              </datalist>
              <i className="ri-search-line absolute right-2.5 text-slate-400 text-xs pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              required
              value={form.target_to || branchName || "Business Unit"}
              onChange={(e) => updateField("target_to", e.target.value)}
              placeholder={`Own BU: ${branchName || "Current Business Unit"}`}
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          )}
        </div>

        {/* Show Identity Checkbox */}
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="checkbox"
            id="show_identity_check"
            checked={form.show_identity ?? true}
            onChange={(e) => updateField("show_identity", e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <label htmlFor="show_identity_check" className="text-xs text-slate-700 select-none cursor-pointer">
            Show Identity
          </label>
        </div>
      </div>
    </div>
  );
});
