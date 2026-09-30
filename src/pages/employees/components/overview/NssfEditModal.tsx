import React, { useState } from "react";
import type { Employee, EmployeeNssfInfo } from "../../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { PersonalNssfFields } from "../add-employee/personal/PersonalNssfFields";

interface NssfEditModalProps {
  employee: Employee;
  onClose: () => void;
  onSaved: (updatedNssf: EmployeeNssfInfo) => void;
}

export const NssfEditModal: React.FC<NssfEditModalProps> = ({
  employee,
  onClose,
  onSaved,
}) => {
  const khParts = (employee.kh_name || (employee as any).khmer_name || "").trim().split(/\s+/).filter(Boolean);
  const defaultKhLast = khParts.length > 1 ? khParts[0] : (khParts[0] || "");
  const defaultKhFirst = khParts.length > 1 ? khParts.slice(1).join(" ") : (khParts[0] || "");

  const defaultIdentityCode =
    employee.nssf_number ||
    employee.employee_code ||
    (employee as any).national_id_number ||
    employee.national_id ||
    (employee as any).id_card_number ||
    employee.biometric_user_id ||
    "";

  const rawNssf = employee.nssf_info || (employee as any).hiring_info?.nssf_info;

  const existingNssf: EmployeeNssfInfo = {
    register_nssf: Boolean(employee.register_nssf || rawNssf?.register_nssf || employee.nssf_number),
    identity_code: rawNssf?.identity_code || defaultIdentityCode,
    joining_date: rawNssf?.joining_date || employee.join_date || employee.start_date || new Date().toISOString().slice(0, 10),
    first_name_latin: rawNssf?.first_name_latin || employee.first_name || "",
    last_name_latin: rawNssf?.last_name_latin || employee.last_name || "",
    first_name_kh: rawNssf?.first_name_kh || defaultKhFirst,
    last_name_kh: rawNssf?.last_name_kh || defaultKhLast,
    monthly_wage_type: rawNssf?.monthly_wage_type || "Formula",
    monthly_wage: rawNssf?.monthly_wage || "Taxable Salary",
    seniority_pension_fund: rawNssf?.seniority_pension_fund || "",
    remark: rawNssf?.remark || "",
    status: rawNssf?.status || "Active",
  };

  const [nssf, setNssf] = useState<EmployeeNssfInfo>(existingNssf);
  const [saving, setSaving] = useState(false);

  const updateNssf = (field: keyof EmployeeNssfInfo, value: any) => {
    setNssf((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanNum = nssf.identity_code?.trim() || null;
      const updatedNssf: EmployeeNssfInfo = {
        ...nssf,
        register_nssf: Boolean(cleanNum || nssf.register_nssf),
      };

      const hiringInfo = {
        ...((employee as any).hiring_info || {}),
        nssf_info: updatedNssf,
      };

      const { error } = await supabase
        .from("employees")
        .update({
          nssf_number: cleanNum,
          register_nssf: Boolean(cleanNum || nssf.register_nssf),
          hiring_info: hiringInfo,
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast("NSSF Updated", "Social Security details updated successfully.", "success");
      onSaved(updatedNssf);
      onClose();
    } catch (err: any) {
      toast("Update Failed", err.message || "Could not update NSSF details", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <i className="ri-shield-cross-line text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official NSSF Information
              </h3>
              <p className="text-xs text-slate-500">
                National Social Security Fund (MLVT / Cambodia)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <PersonalNssfFields nssf={nssf} updateNssf={updateNssf} />
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
              <span>{saving ? "Saving..." : "Save NSSF Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
