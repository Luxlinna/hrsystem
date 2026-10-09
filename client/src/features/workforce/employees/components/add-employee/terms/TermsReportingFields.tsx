import { memo, useMemo } from "react";
import type { EmployeeFormState } from "../../../types";
import type { ModalManagerEmployee } from "../types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { formatKhmerFullName } from "../../../nameUtils";

interface TermsReportingFieldsProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  buManagers: ModalManagerEmployee[];
  buCeos: ModalManagerEmployee[];
}

const HIRING_STATUS_OPTIONS = [
  { value: "probation", label: "Probation" },
  { value: "intern", label: "Intern" },
  { value: "confirmed", label: "Confirmed / Active" },
  { value: "contractor", label: "Contractor" },
  { value: "apprentice", label: "Apprentice" },
];

export const TermsReportingFields = memo(function TermsReportingFields({
  form,
  onChange,
  buManagers,
  buCeos,
}: TermsReportingFieldsProps) {
  const isCustomManager =
    Boolean(form.line_manager) &&
    !buManagers.some((m) => {
      const name = formatKhmerFullName(m);
      return name.toLowerCase() === (form.line_manager || "").toLowerCase();
    }) &&
    !buCeos.some((m) => {
      const name = formatKhmerFullName(m);
      return name.toLowerCase() === (form.line_manager || "").toLowerCase();
    });

  const managerOptions = useMemo(() => {
    const list: Array<{ value: string; label: string; sublabel?: string; badge?: string }> = [];
    buManagers.forEach((m) => {
      const name = formatKhmerFullName(m);
      list.push({
        value: name,
        label: name,
        sublabel: m.realRole || m.department || "Manager",
        badge: "Manager",
      });
    });
    buCeos.forEach((c) => {
      const name = formatKhmerFullName(c);
      list.push({
        value: name,
        label: name,
        sublabel: c.realRole || "Executive",
        badge: "Executive",
      });
    });
    return list;
  }, [buManagers, buCeos]);

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
        <SearchableSelect
          options={managerOptions}
          value={form.line_manager || ""}
          onChange={(val) => {
            onChange("line_manager", val);
            const matched = [...buManagers, ...buCeos].find(
              (m) => formatKhmerFullName(m).toLowerCase() === val.toLowerCase()
            );
            onChange("reports_to", matched?.id || "");
          }}
          placeholder="Select Line Manager"
          searchPlaceholder="Search manager..."
          showClear
        />

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
        <SearchableSelect
          options={HIRING_STATUS_OPTIONS}
          value={form.hiring_status || "probation"}
          onChange={(val) => {
            onChange("hiring_status", val);
            if (val === "probation" || val === "intern") {
              onChange("status", "onboarding");
            } else if (val === "confirmed" || val === "passed") {
              onChange("status", "active");
            }
          }}
          placeholder="Select Hiring Status"
          searchPlaceholder="Search status..."
        />
      </div>
    </div>
  );
});
