import { memo } from "react";
import type { EmployeeEmploymentHistoryItem } from "../../../types";

interface PersonalEmploymentRowProps {
  emp: EmployeeEmploymentHistoryItem;
  idx: number;
  onUpdate: (idx: number, updated: EmployeeEmploymentHistoryItem) => void;
  onRemove: (idx: number) => void;
}

export const PersonalEmploymentRow = memo(function PersonalEmploymentRow({
  emp,
  idx,
  onUpdate,
  onRemove,
}: PersonalEmploymentRowProps) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-2 px-2.5 text-slate-500 font-medium">{idx + 1}</td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.company_name}
          onChange={(e) => onUpdate(idx, { ...emp, company_name: e.target.value })}
          placeholder="Company Name"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="date"
          value={emp.start_date}
          onChange={(e) => onUpdate(idx, { ...emp, start_date: e.target.value })}
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="date"
          value={emp.end_date}
          onChange={(e) => onUpdate(idx, { ...emp, end_date: e.target.value })}
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.designation}
          onChange={(e) => onUpdate(idx, { ...emp, designation: e.target.value })}
          placeholder="Designation / Role"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.supervisor_name}
          onChange={(e) => onUpdate(idx, { ...emp, supervisor_name: e.target.value })}
          placeholder="Supervisor Name"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.supervisor_phone_number}
          onChange={(e) => onUpdate(idx, { ...emp, supervisor_phone_number: e.target.value })}
          placeholder="e.g. 091 234 567"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.remark}
          onChange={(e) => onUpdate(idx, { ...emp, remark: e.target.value })}
          placeholder="Remark"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.rate}
          onChange={(e) => onUpdate(idx, { ...emp, rate: e.target.value })}
          placeholder="Rate / Salary"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={emp.reason_for_leaving}
          onChange={(e) => onUpdate(idx, { ...emp, reason_for_leaving: e.target.value })}
          placeholder="Reason for leaving"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
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
