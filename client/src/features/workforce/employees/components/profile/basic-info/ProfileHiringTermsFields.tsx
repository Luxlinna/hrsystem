import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";

export const ProfileHiringTermsFields = memo(function ProfileHiringTermsFields({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Contract Type & Terms */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Contract Type &amp; Terms
        </label>
        {editing ? (
          <div className="space-y-1.5">
            <select
              value={form.contract_type || "Internship"}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
            >
              <option value="Internship">Internship</option>
              <option value="FDC">Fixed Duration Contract (FDC)</option>
              <option value="UDC">Undetermined Duration (UDC)</option>
              <option value="Probation">Probation</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Consultant">Consultant</option>
            </select>
            <input
              type="text"
              placeholder="Contract remarks / notes"
              value={form.contract_remark || ""}
              onChange={(e) => setForm({ ...form, contract_remark: e.target.value })}
              className="w-full px-2.5 py-1 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-[#253C7D] border border-blue-200 text-xs font-bold">
              {employee.contract_type || "Internship"}
            </span>
            {employee.contract_remark && (
              <span className="text-xs text-slate-500 font-medium">
                ({employee.contract_remark})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contract Window */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Contract Duration Window
        </label>
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Start</span>
              <input
                type="date"
                value={form.contract_effective_date || form.start_date || form.join_date || ""}
                onChange={(e) => setForm({ ...form, contract_effective_date: e.target.value })}
                className="w-full px-2 py-1 rounded-lg border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">End</span>
              <input
                type="date"
                value={form.contract_end_date || form.fdc_end_date || ""}
                onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })}
                className="w-full px-2 py-1 rounded-lg border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-800 font-mono font-bold">
            {employee.contract_effective_date || employee.start_date || employee.join_date || "—"}{" "}
            to {employee.contract_end_date || employee.fdc_end_date || "—"}
          </p>
        )}
      </div>

      {/* Working Hours */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Working Hours
        </label>
        {editing ? (
          <input
            value={form.working_hour || "8:00 AM - 5:00 PM (44 hrs/wk)"}
            onChange={(e) => setForm({ ...form, working_hour: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-slate-800 font-medium">
            {employee.working_hour || "8:00 AM - 5:00 PM (44 hrs/wk)"}
          </p>
        )}
      </div>

      {/* Working Schedule */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Working Schedule
        </label>
        {editing ? (
          <input
            value={form.total_working_days || "5.5 Days/Week (Mon - Sat Noon)"}
            onChange={(e) => setForm({ ...form, total_working_days: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-slate-800 font-medium">
            {employee.total_working_days || "5.5 Days/Week (Mon - Sat Noon)"}
          </p>
        )}
      </div>

      {/* Working Location */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Work Location / Site
        </label>
        {editing ? (
          <input
            value={form.site || form.working_location || "Phnom Penh"}
            onChange={(e) =>
              setForm({ ...form, site: e.target.value, working_location: e.target.value })
            }
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
            <i className="ri-map-pin-2-line text-emerald-600" />
            <span>
              {employee.site ||
                employee.working_location ||
                employee.work_locations?.name ||
                employee.branches?.name ||
                "Phnom Penh"}
            </span>
          </div>
        )}
      </div>
    </>
  );
});
