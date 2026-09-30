import { memo } from "react";
import type { PersonalSectionProps } from "./types";
import type { EmployeeNssfInfo } from "../../../types";
import { PersonalNssfFields } from "./PersonalNssfFields";

export const PersonalNssfSection = memo(function PersonalNssfSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const isEnrolled = Boolean(form.register_nssf);

  const khParts = (form.kh_name || (form as any).khmer_name || "").trim().split(/\s+/).filter(Boolean);
  const defaultKhLast = khParts.length > 1 ? khParts[0] : (khParts[0] || "");
  const defaultKhFirst = khParts.length > 1 ? khParts.slice(1).join(" ") : (khParts[0] || "");

  const defaultIdentityCode =
    form.nssf_number ||
    form.employee_code ||
    form.national_id_number ||
    form.national_id ||
    form.id_card_number ||
    form.biometric_user_id ||
    "";

  const defaultJoiningDate =
    form.join_date ||
    form.start_date ||
    form.hire_date ||
    new Date().toISOString().slice(0, 10);

  const nssf: EmployeeNssfInfo = {
    register_nssf: isEnrolled,
    identity_code: form.nssf_info?.identity_code || defaultIdentityCode,
    joining_date: form.nssf_info?.joining_date || defaultJoiningDate,
    first_name_latin: form.nssf_info?.first_name_latin || form.first_name || "",
    last_name_latin: form.nssf_info?.last_name_latin || form.last_name || "",
    first_name_kh: form.nssf_info?.first_name_kh || defaultKhFirst,
    last_name_kh: form.nssf_info?.last_name_kh || defaultKhLast,
    monthly_wage_type: form.nssf_info?.monthly_wage_type || "Formula",
    monthly_wage: form.nssf_info?.monthly_wage || "Taxable Salary",
    seniority_pension_fund: form.nssf_info?.seniority_pension_fund || "",
    remark: form.nssf_info?.remark || "",
    status: form.nssf_info?.status || "Active",
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
      identity_code: nssf.identity_code || defaultIdentityCode,
      joining_date: nssf.joining_date || defaultJoiningDate,
      first_name_latin: nssf.first_name_latin || form.first_name || "",
      last_name_latin: nssf.last_name_latin || form.last_name || "",
      first_name_kh: nssf.first_name_kh || defaultKhFirst,
      last_name_kh: nssf.last_name_kh || defaultKhLast,
    };
    onChange("nssf_info" as any, updated);
    if (!form.nssf_number && updated.identity_code) {
      onChange("nssf_number", updated.identity_code);
    }
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
