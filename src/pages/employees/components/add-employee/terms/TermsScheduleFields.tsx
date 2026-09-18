import { memo } from "react";
import type { EmployeeFormState } from "../../../types";

interface TermsScheduleFieldsProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const TermsScheduleFields = memo(function TermsScheduleFields({
  form,
  onChange,
}: TermsScheduleFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Working Hour */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Working Hour
        </label>
        <input
          type="text"
          value={form.working_hour}
          onChange={(e) => onChange("working_hour", e.target.value)}
          placeholder="e.g. 8:00 AM - 5:00 PM (44 hrs/wk)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Total Working Day */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Total Working Day
        </label>
        <input
          type="text"
          value={form.total_working_days}
          onChange={(e) => onChange("total_working_days", e.target.value)}
          placeholder="e.g. 5.5 Days/Week (Mon - Sat Noon)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Full Time / Part Time */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Full Time / Part Time
        </label>
        <select
          value={form.employment_type}
          onChange={(e) => onChange("employment_type", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>
      </div>

      {/* Start Date / Joining Date */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Start Date / Joining Date <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          required
          value={form.start_date || form.join_date}
          onChange={(e) => {
            onChange("start_date", e.target.value);
            onChange("join_date", e.target.value);
            if (!form.contract_effective_date) {
              onChange("contract_effective_date", e.target.value);
            }
          }}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
