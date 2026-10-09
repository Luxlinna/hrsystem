import { memo } from "react";
import type { ComplaintFormState } from "../types";

interface ComplaintRecipientFieldProps {
  form: ComplaintFormState;
  updateField: <K extends keyof ComplaintFormState>(field: K, value: ComplaintFormState[K]) => void;
  buDivisions: string[];
  buDepartments: string[];
  onCategoryChange: (cat: string) => void;
}

export const ComplaintRecipientField = memo(function ComplaintRecipientField({
  form,
  updateField,
  buDivisions,
  buDepartments,
  onCategoryChange,
}: ComplaintRecipientFieldProps) {
  const currentCategory = form.target_category === "Department" ? "Department" : "Division";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
      <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
        Complaint/Suggestion To <span className="text-rose-500">*</span>
      </label>
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center border border-slate-300 rounded overflow-hidden bg-white focus-within:border-sky-500">
          <select
            value={currentCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border-r border-slate-300 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Division">Division</option>
            <option value="Department">Department</option>
          </select>

          {currentCategory === "Department" ? (
            <select
              required
              value={form.target_to}
              onChange={(e) => updateField("target_to", e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 bg-white focus:outline-none cursor-pointer"
            >
              <option value="">-- Select Department --</option>
              {buDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          ) : (
            <select
              required
              value={form.target_to}
              onChange={(e) => updateField("target_to", e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 bg-white focus:outline-none cursor-pointer"
            >
              <option value="">-- Select Division from Org --</option>
              {buDivisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
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
