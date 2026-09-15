import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import type { ModalManagerEmployee } from "./types";

interface AddEmployeeTermsTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  buManagers: ModalManagerEmployee[];
  buCeos: ModalManagerEmployee[];
}

export const AddEmployeeTermsTab = memo(function AddEmployeeTermsTab({
  form,
  onChange,
  buManagers,
  buCeos,
}: AddEmployeeTermsTabProps) {
  const isCustomManager =
    Boolean(form.line_manager) &&
    !buManagers.some((m) => {
      const name = `${m.first_name} ${m.last_name}`.trim();
      return name.toLowerCase() === (form.line_manager || "").toLowerCase();
    }) &&
    !buCeos.some((m) => {
      const name = `${m.first_name} ${m.last_name}`.trim();
      return name.toLowerCase() === (form.line_manager || "").toLowerCase();
    });

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border border-amber-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-calendar-check-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Terms &amp; Employment Schedule
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
              Step 3 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Working schedule, employment category, official start date, direct line manager, contract classification, and probation status.
          </p>
        </div>
      </div>

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

        {/* Start Date */}
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
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Line Manager (Reporting Line) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-extrabold text-slate-700">
              Line Manager (Reporting Line)
            </label>
            <span className="text-[10px] font-bold text-[#253C7D]">
              {buManagers.length} Managers Available
            </span>
          </div>
          <select
            value={isCustomManager ? "__CUSTOM__" : form.line_manager}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__CUSTOM__") {
                onChange("line_manager", "");
                onChange("reports_to", "");
              } else {
                onChange("line_manager", val);
                const matched = [...buManagers, ...buCeos].find(
                  (m) => `${m.first_name} ${m.last_name}`.trim().toLowerCase() === val.toLowerCase()
                );
                onChange("reports_to", matched?.id || "");
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">-- Select Line Manager --</option>
            <optgroup label="BU Leadership &amp; Managers">
              {buManagers.map((m) => {
                const name = `${m.first_name} ${m.last_name}`.trim();
                return (
                  <option key={m.id} value={name}>
                    👤 {name} ({m.realRole || m.department || "Manager"})
                  </option>
                );
              })}
            </optgroup>
            {buCeos.length > 0 && (
              <optgroup label="Executive &amp; Directors">
                {buCeos.map((c) => {
                  const name = `${c.first_name} ${c.last_name}`.trim();
                  return (
                    <option key={c.id} value={name}>
                      ⭐ {name} ({c.realRole || "Executive"})
                    </option>
                  );
                })}
              </optgroup>
            )}
            <option value="__CUSTOM__">✍ Custom / External Manager...</option>
          </select>

          {isCustomManager && (
            <div className="mt-2">
              <input
                type="text"
                value={form.line_manager}
                onChange={(e) => onChange("line_manager", e.target.value)}
                placeholder="Type reporting manager name &amp; title"
                className="w-full px-3.5 py-2 rounded-xl bg-amber-50/40 border border-amber-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}
        </div>

        {/* Type of Contract */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Type of Contract
          </label>
          <select
            value={form.contract_type}
            onChange={(e) => onChange("contract_type", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="FDC">FDC (Fixed Duration Contract)</option>
            <option value="UDC">UDC (Undetermined Duration Contract)</option>
            <option value="Probationary">Probationary Contract</option>
            <option value="Internship">Internship Agreement</option>
            <option value="Casual">Casual / Project Basis</option>
          </select>
        </div>

        {/* Date End of FDC */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Date End of FDC (Contract Expiry)
          </label>
          <input
            type="date"
            value={form.fdc_end_date}
            onChange={(e) => onChange("fdc_end_date", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Status (probation, intern, etc.) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Hiring Status
          </label>
          <select
            value={form.hiring_status}
            onChange={(e) => {
              const val = e.target.value;
              onChange("hiring_status", val);
              if (val === "probation" || val === "intern") {
                onChange("status", "onboarding");
              } else if (val === "confirmed" || val === "passed") {
                onChange("status", "active");
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="probation">Probation</option>
            <option value="intern">Intern</option>
            <option value="confirmed">Confirmed / Active</option>
            <option value="contractor">Contractor</option>
            <option value="apprentice">Apprentice</option>
          </select>
        </div>
      </div>
    </div>
  );
});
