import { memo } from "react";
import type { EmployeeFamilyMemberItem } from "../../../types";

interface PersonalFamilyMemberRowProps {
  member: EmployeeFamilyMemberItem;
  idx: number;
  onUpdate: (idx: number, updated: EmployeeFamilyMemberItem) => void;
  onRemove: (idx: number) => void;
}

export const PersonalFamilyMemberRow = memo(function PersonalFamilyMemberRow({
  member,
  idx,
  onUpdate,
  onRemove,
}: PersonalFamilyMemberRowProps) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-2 px-2.5 text-slate-500 font-medium">{idx + 1}</td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={member.name}
          onChange={(e) => onUpdate(idx, { ...member, name: e.target.value })}
          placeholder="Name"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <select
          value={member.relationship}
          onChange={(e) => onUpdate(idx, { ...member, relationship: e.target.value })}
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
        >
          <option value="Spouse">Spouse</option>
          <option value="Child">Child</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Brother">Brother</option>
          <option value="Sister">Sister</option>
          <option value="Other">Other</option>
        </select>
      </td>
      <td className="py-2 px-2.5">
        <input
          type="date"
          value={member.date_of_birth}
          onChange={(e) => onUpdate(idx, { ...member, date_of_birth: e.target.value })}
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <select
          value={member.gender}
          onChange={(e) => onUpdate(idx, { ...member, gender: e.target.value })}
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={member.nationality}
          onChange={(e) => onUpdate(idx, { ...member, nationality: e.target.value })}
          placeholder="Khmer"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5 text-center">
        <input
          type="checkbox"
          checked={Boolean(member.tax_filing)}
          onChange={(e) => onUpdate(idx, { ...member, tax_filing: e.target.checked })}
          className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={member.phone_number}
          onChange={(e) => onUpdate(idx, { ...member, phone_number: e.target.value })}
          placeholder="Phone"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={member.remark}
          onChange={(e) => onUpdate(idx, { ...member, remark: e.target.value })}
          placeholder="Remark"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUpdate(idx, { ...member, attachment: file.name });
            }
          }}
          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
      </td>
      <td className="py-2 px-2.5 text-center">
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title="Remove"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </td>
    </tr>
  );
});
