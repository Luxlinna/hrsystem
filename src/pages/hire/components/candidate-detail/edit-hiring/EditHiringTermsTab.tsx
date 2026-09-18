import { memo } from "react";
import type { EditHiringFormData, ModalManagerEmployee } from "./types";

interface EditHiringTermsTabProps {
  formData: EditHiringFormData;
  onChange: (field: keyof EditHiringFormData, value: string) => void;
  buManagers: ModalManagerEmployee[];
  buCeos: ModalManagerEmployee[];
}

export const EditHiringTermsTab = memo(function EditHiringTermsTab({
  formData,
  onChange,
  buManagers,
  buCeos,
}: EditHiringTermsTabProps) {
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
            Working schedule, employment category, official start date, direct line manager, and contract classification.
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
            value={formData.working_hour}
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
            value={formData.total_working_days}
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
            value={formData.employment_type}
            onChange={(e) => onChange("employment_type", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
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
            Start Date / Joining Date
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Line Manager (Reporting Line) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-extrabold text-slate-700">
              Line Manager (Reporting Line)
            </label>
            {formData.department && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 mt-0.5 inline-block">
                Dept: {formData.department}
              </span>
            )}
          </div>

          <select
            value={formData.line_manager}
            onChange={(e) => onChange("line_manager", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">-- Select Line Manager --</option>

            {/* Managers in this BU */}
            {buManagers.length > 0 && (
              <optgroup label={`${formData.bu_full_name || "BU"} — Managers`}>
                {buManagers.map((m) => {
                  const val = `${m.first_name} ${m.last_name} (${m.realRole})`;
                  return (
                    <option key={m.id} value={val}>
                      {m.first_name} {m.last_name} — {m.realRole}
                    </option>
                  );
                })}
              </optgroup>
            )}

            {/* BU CEOs in this BU */}
            {buCeos.length > 0 && (
              <optgroup label={`${formData.bu_full_name || "BU"} — BU CEO`}>
                {buCeos.map((m) => {
                  const val = `${m.first_name} ${m.last_name} (${m.realRole})`;
                  return (
                    <option key={m.id} value={val}>
                      {m.first_name} {m.last_name} — {m.realRole}
                    </option>
                  );
                })}
              </optgroup>
            )}

            {buManagers.length === 0 && buCeos.length === 0 && (
              <option value="" disabled>
                {formData.bu_full_name
                  ? `No managers or CEOs found in ${formData.bu_full_name}`
                  : "Select a Business Unit in Step 2 first"}
              </option>
            )}
          </select>

          {formData.bu_full_name ? (
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Showing managers &amp; BU CEOs from:{" "}
              <span className="font-bold text-[#253C7D]">{formData.bu_full_name}</span>
            </p>
          ) : (
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <i className="ri-information-line" />
              Select the candidate's Main Branch / BU in Step 2 to load managers.
            </p>
          )}
        </div>

        {/* Type of Contract */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Type of Contract
          </label>
          <select
            value={formData.contract_type}
            onChange={(e) => onChange("contract_type", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="FDC">Fixed Duration Contract (FDC)</option>
            <option value="UDC">Undetermined Duration Contract (UDC)</option>
            <option value="Probation">Probationary Contract</option>
            <option value="Internship">Internship Agreement</option>
          </select>
        </div>

        {/* Date End of FDC */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Date End of FDC (Expiry)
          </label>
          <input
            type="date"
            value={formData.fdc_end_date}
            onChange={(e) => onChange("fdc_end_date", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Status (probation, intern) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Hiring Status (probation, intern)
          </label>
          <select
            value={formData.hiring_status}
            onChange={(e) => onChange("hiring_status", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="probation">Probation (3 Months)</option>
            <option value="intern">Intern</option>
            <option value="confirmed">Confirmed / Regular</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>
    </div>
  );
});
