import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";
import type { EmployeeIdentificationItem } from "../../../types";
import { extractMachinePin } from "@/lib/biometricUtils";

export const ProfileIdentificationSection = memo(function ProfileIdentificationSection({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  const identifications: EmployeeIdentificationItem[] =
    (editing ? form.identifications : employee.identifications) as EmployeeIdentificationItem[] ||
    (employee.identifications as EmployeeIdentificationItem[]) ||
    [];

  const primaryId =
    identifications[0] || {
      identification_type: "National ID Card",
      identification_number:
        (editing ? form.national_id_number : employee.national_id_number) || "—",
      expiration_date: "—",
    };

  const handleUpdatePrimaryId = (
    field: keyof EmployeeIdentificationItem,
    val: string
  ) => {
    const currentList = [...identifications];
    const existing = currentList[0] || {
      identification_type: "National ID Card",
      identification_number: form.national_id_number || "",
      expiration_date: "",
    };
    const updatedFirst = { ...existing, [field]: val };
    const updatedList = [updatedFirst, ...currentList.slice(1)];
    setForm((prev) => ({
      ...prev,
      identifications: updatedList,
      national_id_number:
        field === "identification_number" ? val : prev.national_id_number,
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg shadow-2xs">
          <i className="ri-id-card-line" />
        </div>
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
            Official Identification &amp; Tax Credentials
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            National ID records, staff identifier, biometric credentials, and tax filings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Primary ID */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            {editing ? "Primary Identification" : primaryId.identification_type || "National ID"}
          </span>
          {editing ? (
            <div className="space-y-1.5">
              <select
                value={primaryId.identification_type || "National ID Card"}
                onChange={(e) => handleUpdatePrimaryId("identification_type", e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-[#253C7D] bg-white"
              >
                <option value="National ID Card">National ID Card</option>
                <option value="Passport">Passport</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="Driving License">Driving License</option>
              </select>
              <input
                type="text"
                placeholder="ID Number"
                value={primaryId.identification_number === "—" ? "" : primaryId.identification_number}
                onChange={(e) => handleUpdatePrimaryId("identification_number", e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D] bg-white"
              />
              <input
                type="date"
                placeholder="Expiration"
                value={primaryId.expiration_date === "—" ? "" : primaryId.expiration_date}
                onChange={(e) => handleUpdatePrimaryId("expiration_date", e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-mono focus:outline-none focus:border-[#253C7D] bg-white"
              />
            </div>
          ) : (
            <>
              <p className="text-xs font-mono font-black text-slate-900">
                {primaryId.identification_number || employee.national_id_number || "—"}
              </p>
              {primaryId.expiration_date && primaryId.expiration_date !== "—" && (
                <p className="text-[10px] text-slate-500 mt-1">Exp: {primaryId.expiration_date}</p>
              )}
            </>
          )}
        </div>

        {/* Staff ID */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Staff ID / Employee Code
          </span>
          <p className="text-xs font-mono font-black text-[#253C7D]">
            {employee.employee_code || "006"}
          </p>
          <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 mt-1">
            System ID
          </span>
        </div>

        {/* Biometric PIN */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Biometric PIN / Machine ID
          </span>
          {editing ? (
            <div className="space-y-1">
              <input
                type="text"
                placeholder="e.g. 00000006"
                value={form.biometric_user_id || ""}
                onChange={(e) => setForm({ ...form, biometric_user_id: e.target.value })}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D] bg-white"
              />
              <span className="text-[10px] text-slate-400">Terminal user enrollment pin</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900">
                <i className="ri-fingerprint-line text-slate-500" />
                <span>{employee.biometric_user_id || "Not Linked"}</span>
              </div>
              {employee.biometric_user_id && (
                <p className="text-[10px] text-indigo-600 font-mono mt-1 font-semibold">
                  Terminal: {extractMachinePin(employee.biometric_user_id)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Tax Method / TIN */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Tax Method / TIN
          </span>
          {editing ? (
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Tax ID Number (TIN)"
                value={form.employee_tax_number || ""}
                onChange={(e) => setForm({ ...form, employee_tax_number: e.target.value })}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D] bg-white"
              />
              <span className="text-[10px] text-slate-400">GDT registered tax code</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-900 font-mono">
                {employee.employee_tax_number || employee.tax_method || "Resident"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">General Department of Taxation</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
