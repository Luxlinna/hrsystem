import { memo } from "react";
import type { PersonalSectionProps } from "./types";
import type { EmployeeFamilyMemberItem } from "../../../types";
import { PersonalFamilyMemberRow } from "./PersonalFamilyMemberRow";

export const PersonalFamilySection = memo(function PersonalFamilySection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.family_members || [];
    onChange("family_members", [
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
        attachment: "",
      },
    ]);
  };

  const handleUpdate = (idx: number, updatedItem: EmployeeFamilyMemberItem) => {
    const updated = [...(form.family_members || [])];
    updated[idx] = updatedItem;
    onChange("family_members", updated);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.family_members || [])];
    updated.splice(idx, 1);
    onChange("family_members", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Family Member Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Family Member"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[960px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-2.5 w-10">No.</th>
              <th className="py-2 px-2.5">Name</th>
              <th className="py-2 px-2.5">Relationship</th>
              <th className="py-2 px-2.5">Date of Birth</th>
              <th className="py-2 px-2.5">Gender</th>
              <th className="py-2 px-2.5">Nationality</th>
              <th className="py-2 px-2.5 text-center">Tax Filing</th>
              <th className="py-2 px-2.5">Phone Number</th>
              <th className="py-2 px-2.5">Remark</th>
              <th className="py-2 px-2.5">Attachment</th>
              <th className="py-2 px-2.5 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.family_members && form.family_members.length > 0 ? (
              form.family_members.map((member, idx) => (
                <PersonalFamilyMemberRow
                  key={idx}
                  member={member}
                  idx={idx}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400 font-medium">
                  Empty Family Members
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Family Member"
                  >
                    <i className="ri-add-line" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
