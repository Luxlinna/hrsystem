import React, { useState } from "react";
import type { Employee, EmployeeNssfInfo } from "../../types";
import { NssfEditModal } from "./NssfEditModal";
import { NssfInfoDetails } from "./NssfInfoDetails";
import { NssfAttachmentSection } from "./NssfAttachmentSection";

interface NssfInfoCardProps {
  employee: Employee;
}

export const NssfInfoCard: React.FC<NssfInfoCardProps> = ({ employee }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const initialNssf: EmployeeNssfInfo =
    employee.nssf_info ||
    (employee as any).hiring_info?.nssf_info || {
      register_nssf: Boolean(employee.register_nssf || employee.nssf_number),
      identity_code: employee.nssf_number || "",
      joining_date: employee.join_date || "",
      first_name_kh: employee.kh_name ? employee.kh_name.split(" ")[1] || "" : "",
      last_name_kh: employee.kh_name ? employee.kh_name.split(" ")[0] || "" : "",
      first_name_latin: employee.first_name || "",
      last_name_latin: employee.last_name || "",
      monthly_wage_type: "Formula",
      monthly_wage: "Taxable Salary",
      seniority_pension_fund: "",
      remark: "",
      status: "Active",
    };

  const [nssf, setNssf] = useState<EmployeeNssfInfo>(initialNssf);

  const handleSaved = (updated: EmployeeNssfInfo) => {
    setNssf(updated);
  };

  const handleUpdateAttachments = (attachments: any[]) => {
    setNssf((prev) => ({ ...prev, attachments } as any));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 max-w-5xl">
      {/* Header bar with Action */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            National Social Security Fund (NSSF)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Cambodian Ministry of Labour and Vocational Training (MLVT)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#253C7D] text-white hover:bg-[#1d3066] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
        >
          <i className="ri-edit-line text-xs" />
          <span>Edit NSSF Info</span>
        </button>
      </div>

      {/* 1. NSSF INFO & 2. STATUS INFO */}
      <NssfInfoDetails employee={employee} nssf={nssf} />

      {/* 3. ATTACHMENT INFO */}
      <NssfAttachmentSection
        employee={employee}
        nssf={nssf}
        onUpdateAttachments={handleUpdateAttachments}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <NssfEditModal
          employee={employee}
          onClose={() => setShowEditModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
