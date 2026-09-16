import { memo } from "react";
import type { PersonalSectionProps } from "./types";
import type { EmployeeNssfInfo } from "../../../types";
import { PersonalNssfFields } from "./PersonalNssfFields";

export const PersonalNssfSection = memo(function PersonalNssfSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const isEnrolled = Boolean(form.register_nssf);
  const nssf: EmployeeNssfInfo = form.nssf_info || {
    register_nssf: isEnrolled,
    identity_code: form.nssf_number || "",
    joining_date: new Date().toISOString().slice(0, 10),
    first_name_kh: "",
    last_name_kh: "",
    first_name_latin: form.first_name || "",
    last_name_latin: form.last_name || "",
    monthly_wage_type: "Formula",
    monthly_wage: "Taxable Salary",
    seniority_pension_fund: "",
    remark: "",
    status: "Active",
  };

  const updateNssf = (field: keyof EmployeeNssfInfo, value: any) => {
    const updated = { ...nssf, [field]: value };
    onChange("nssf_info" as any, updated);
    if (field === "identity_code") {
      onChange("nssf_number", value);
    }
  };

  const toggleRegister = (checked: boolean) => {
    onChange("register_nssf", checked);
    const updated: EmployeeNssfInfo = {
      ...nssf,
      register_nssf: checked,
      first_name_latin: nssf.first_name_latin || form.first_name || "",
      last_name_latin: nssf.last_name_latin || form.last_name || "",
      identity_code: nssf.identity_code || form.nssf_number || "",
    };
    onChange("nssf_info" as any, updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200/80 w-full space-y-6">
      {/* Register Nssf Toggle */}
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={isEnrolled}
          onChange={(e) => toggleRegister(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
          Register Nssf
        </span>
      </label>

      {isEnrolled && (
        <PersonalNssfFields nssf={nssf} updateNssf={updateNssf} />
      )}
    </div>
  );
});
