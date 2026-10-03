import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";
import type { EmployeeEmergencyContactItem } from "../../../types";

export const ProfileEmergencyContactFields = memo(function ProfileEmergencyContactFields({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  const emergencyContacts: EmployeeEmergencyContactItem[] =
    (editing ? form.emergency_contacts : employee.emergency_contacts) as EmployeeEmergencyContactItem[] ||
    (employee.emergency_contacts as EmployeeEmergencyContactItem[]) ||
    [];

  const emergencyContact =
    emergencyContacts[0] || {
      contact_person:
        (editing ? form.emergency_contact_name : employee.emergency_contact_name) || "—",
      relationship: "Emergency Contact",
      phone_number:
        (editing ? form.emergency_phone_number : employee.emergency_phone_number) || "—",
    };

  const handleUpdate = (field: keyof EmployeeEmergencyContactItem, val: string) => {
    const currentList = [...emergencyContacts];
    const existing = currentList[0] || {
      contact_person: form.emergency_contact_name || "",
      relationship: "Emergency Contact",
      phone_number: form.emergency_phone_number || "",
    };
    const updatedFirst = { ...existing, [field]: val };
    const updatedList = [updatedFirst, ...currentList.slice(1)];
    setForm((prev) => ({
      ...prev,
      emergency_contacts: updatedList,
      emergency_contact_name:
        field === "contact_person" ? val : prev.emergency_contact_name,
      emergency_phone_number:
        field === "phone_number" ? val : prev.emergency_phone_number,
    }));
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Emergency Contact (Next-of-Kin)
      </label>
      {editing ? (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <input
            placeholder="Contact Person Name"
            value={emergencyContact.contact_person === "—" ? "" : emergencyContact.contact_person}
            onChange={(e) => handleUpdate("contact_person", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#253C7D] bg-white"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              placeholder="Relationship"
              value={emergencyContact.relationship === "Emergency Contact" ? "" : emergencyContact.relationship}
              onChange={(e) => handleUpdate("relationship", e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#253C7D] bg-white"
            />
            <input
              placeholder="Phone Number"
              value={emergencyContact.phone_number === "—" ? "" : emergencyContact.phone_number}
              onChange={(e) => handleUpdate("phone_number", e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D] bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
            <i className="ri-contacts-line text-rose-500 text-xs" />
            <span>{emergencyContact.contact_person}</span>
            {emergencyContact.relationship && (
              <span className="text-[10px] text-slate-500 font-normal">
                ({emergencyContact.relationship})
              </span>
            )}
          </p>
          <p className="text-xs font-mono font-bold text-slate-700">
            {emergencyContact.phone_number}
          </p>
        </div>
      )}
    </div>
  );
});
