import { memo } from "react";
import type { EmployeeFamilyMemberItem } from "../../../types";

interface Props {
  fam: EmployeeFamilyMemberItem;
  idx: number;
  editing: boolean;
  onUpdate: (idx: number, field: keyof EmployeeFamilyMemberItem, val: any) => void;
  onRemove: (idx: number) => void;
}

export const ProfileFamilyMemberRow = memo(function ProfileFamilyMemberRow({
  fam,
  idx,
  editing,
  onUpdate,
  onRemove,
}: Props) {
  if (editing) {
    return (
      <tr className="hover:bg-slate-50/70 transition-colors">
        <td className="py-2 px-2.5">
          <input
            type="text"
            value={fam.name}
            onChange={(e) => onUpdate(idx, "name", e.target.value)}
            placeholder="Full Name"
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="py-2 px-2.5">
          <select
            value={fam.relationship || "Child"}
            onChange={(e) => onUpdate(idx, "relationship", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#253C7D] bg-white"
          >
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
            <option value="Other">Other</option>
          </select>
        </td>
        <td className="py-2 px-2.5">
          <select
            value={fam.gender || "Male"}
            onChange={(e) => onUpdate(idx, "gender", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#253C7D] bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </td>
        <td className="py-2 px-2.5">
          <input
            type="date"
            value={fam.date_of_birth || ""}
            onChange={(e) => onUpdate(idx, "date_of_birth", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="py-2 px-2.5">
          <input
            type="text"
            value={fam.nationality || "Khmer"}
            onChange={(e) => onUpdate(idx, "nationality", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="py-2 px-2.5 text-center">
          <select
            value={fam.tax_filing ? "true" : "false"}
            onChange={(e) => onUpdate(idx, "tax_filing", e.target.value === "true")}
            className="px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-bold focus:outline-none focus:border-[#253C7D] bg-white"
          >
            <option value="true">Claimed</option>
            <option value="false">No</option>
          </select>
        </td>
        <td className="py-2 px-2.5 text-center">
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors inline-flex items-center justify-center cursor-pointer"
            title="Delete family member"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="py-2.5 px-3 font-bold text-slate-900">{fam.name}</td>
      <td className="py-2.5 px-3 text-slate-600 font-semibold">{fam.relationship}</td>
      <td className="py-2.5 px-3 text-slate-600">{fam.gender}</td>
      <td className="py-2.5 px-3 text-slate-600 font-mono">{fam.date_of_birth || "—"}</td>
      <td className="py-2.5 px-3 text-slate-600">{fam.nationality || "Khmer"}</td>
      <td className="py-2.5 px-3 text-center">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            fam.tax_filing
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {fam.tax_filing ? "Claimed" : "No"}
        </span>
      </td>
    </tr>
  );
});
