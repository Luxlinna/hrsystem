import { memo } from "react";
import type { PersonalSectionProps } from "./types";
import type { EmployeeEmploymentHistoryItem } from "../../../types";
import { PersonalEmploymentRow } from "./PersonalEmploymentRow";

export const PersonalEmploymentSection = memo(function PersonalEmploymentSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.employment_history || [];
    onChange("employment_history", [
      ...current,
      {
        company_name: "",
        start_date: "",
        end_date: "",
        designation: "",
        supervisor_name: "",
        supervisor_phone_number: "",
        remark: "",
        rate: "",
        reason_for_leaving: "",
      },
    ]);
  };

  const handleUpdate = (idx: number, updatedItem: EmployeeEmploymentHistoryItem) => {
    const updated = [...(form.employment_history || [])];
    updated[idx] = updatedItem;
    onChange("employment_history", updated);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.employment_history || [])];
    updated.splice(idx, 1);
    onChange("employment_history", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Employment History Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Employment History"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[1000px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-2.5 w-10">No.</th>
              <th className="py-2 px-2.5">Company Name</th>
              <th className="py-2 px-2.5">Start Date</th>
              <th className="py-2 px-2.5">End Date</th>
              <th className="py-2 px-2.5">Designation</th>
              <th className="py-2 px-2.5">Supervisor Name</th>
              <th className="py-2 px-2.5">Supervisor Phone Number</th>
              <th className="py-2 px-2.5">Remark</th>
              <th className="py-2 px-2.5">Rate</th>
              <th className="py-2 px-2.5">Reason for Leaving</th>
              <th className="py-2 px-2.5 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.employment_history && form.employment_history.length > 0 ? (
              form.employment_history.map((emp, idx) => (
                <PersonalEmploymentRow
                  key={idx}
                  emp={emp}
                  idx={idx}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400 font-medium">
                  Empty Employment Histories
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Employment History"
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
