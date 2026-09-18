import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import type { ModalManagerEmployee } from "../types";

interface TermsReportingFieldsProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  buManagers: ModalManagerEmployee[];
  buCeos: ModalManagerEmployee[];
}

export const TermsReportingFields = memo(function TermsReportingFields({
  form,
  onChange,
  buManagers,
  buCeos,
}: TermsReportingFieldsProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Line Manager (Reporting Line) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-extrabold text-slate-700">
            Line Manager (Reporting Line)
          </label>
          <span className="text-[10px] font-bold text-[#253C7D]">
            {buManagers.length + buCeos.length} in this BU
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
          {buManagers.length > 0 && (
            <optgroup label={`${form.bu_full_name || "BU"} Leadership & Managers`}>
              {buManagers.map((m) => {
                const name = `${m.first_name} ${m.last_name}`.trim();
                return (
                  <option key={m.id} value={name}>
                    👤 {name} ({m.realRole || m.department || "Manager"})
                  </option>
                );
              })}
            </optgroup>
          )}
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
          {buManagers.length === 0 && buCeos.length === 0 && (
            <option value="" disabled>
              No managers found in this BU (use Custom Manager below)
            </option>
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

      {/* Hiring Status */}
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
  );
});
