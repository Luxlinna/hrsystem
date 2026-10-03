import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";
import type { EmployeeFamilyMemberItem } from "../../../types";
import { ProfileFamilyMemberRow } from "./ProfileFamilyMemberRow";

export const ProfileFamilySection = memo(function ProfileFamilySection({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  const familyMembers: EmployeeFamilyMemberItem[] =
    (editing ? form.family_members : employee.family_members) as EmployeeFamilyMemberItem[] ||
    (employee.family_members as EmployeeFamilyMemberItem[]) ||
    [];

  const handleAddFamilyMember = () => {
    const current = [...familyMembers];
    const updated = [
      ...current,
      {
        name: "",
        relationship: "Child",
        date_of_birth: "",
        gender: "Male",
        nationality: "Khmer",
        tax_filing: false,
        phone_number: "",
        remark: "",
      },
    ];
    setForm((prev) => ({ ...prev, family_members: updated }));
  };

  const handleUpdateFamilyMember = (
    idx: number,
    field: keyof EmployeeFamilyMemberItem,
    val: any
  ) => {
    const updated = [...familyMembers];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm((prev) => ({ ...prev, family_members: updated }));
  };

  const handleRemoveFamilyMember = (idx: number) => {
    const updated = familyMembers.filter((_, i) => i !== idx);
    setForm((prev) => ({ ...prev, family_members: updated }));
  };

  if (familyMembers.length === 0 && !editing) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <i className="ri-parent-line text-[#253C7D]" />
          <span>Registered Family Members ({familyMembers.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={handleAddFamilyMember}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#253C7D] hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-user-add-line" />
              <span>+ Add Family Member</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              Declared for tax filing and emergency dependency records
            </span>
          )}
        </div>
      </div>

      {familyMembers.length === 0 ? (
        <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-500 font-medium mb-2">
            No registered family members declared.
          </p>
          {editing && (
            <button
              type="button"
              onClick={handleAddFamilyMember}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              + Add First Family Member
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Member Name</th>
                <th className="py-2.5 px-3">Relationship</th>
                <th className="py-2.5 px-3">Gender</th>
                <th className="py-2.5 px-3">Date of Birth</th>
                <th className="py-2.5 px-3">Nationality</th>
                <th className="py-2.5 px-3 text-center">Tax Filing</th>
                {editing && <th className="py-2.5 px-3 text-center w-12">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {familyMembers.map((fam, idx) => (
                <ProfileFamilyMemberRow
                  key={idx}
                  fam={fam}
                  idx={idx}
                  editing={editing}
                  onUpdate={handleUpdateFamilyMember}
                  onRemove={handleRemoveFamilyMember}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
