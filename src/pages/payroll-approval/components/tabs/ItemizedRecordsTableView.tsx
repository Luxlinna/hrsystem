import { memo } from "react";
import type { EmployeeItemRecord } from "../../types";
import { STATUS_META } from "../../constants";
import { initials } from "../../payrollApprovalUtils";

interface ItemizedRecordsTableViewProps {
  records: EmployeeItemRecord[];
}

export const ItemizedRecordsTableView = memo(function ItemizedRecordsTableView({
  records,
}: ItemizedRecordsTableViewProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <p className="font-extrabold text-sm text-gray-800">No Itemized Records Found</p>
        <p className="text-xs text-gray-400 mt-1">No records match the current period or search parameters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Period</th>
              <th className="px-5 py-3.5">Base Salary</th>
              <th className="px-5 py-3.5">Bonus</th>
              <th className="px-5 py-3.5">Deductions</th>
              <th className="px-5 py-3.5">Net Pay</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {records.map((rec) => {
              const emp = rec.employees;
              const statusMeta = STATUS_META[rec.status] || STATUS_META.processed;
              return (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {emp?.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-extrabold flex items-center justify-center text-xs shrink-0">
                          {initials(emp?.first_name, emp?.last_name)}
                        </div>
                      )}
                      <div>
                        <span className="font-extrabold text-gray-900 block">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
                        </span>
                        <span className="text-[10px] text-gray-400">{emp?.role || "Staff"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-700">
                    {emp?.department || "General"}
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-gray-800">{rec.month}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-medium">
                    ${Number(rec.base_salary || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-emerald-600 font-semibold">
                    {rec.bonus > 0 ? `+$${Number(rec.bonus).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-rose-600 font-semibold">
                    {rec.deductions > 0 ? `-$${Number(rec.deductions).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-black text-sm text-[#253C7D]">
                    ${Number(rec.net_pay || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      <i className={statusMeta.icon} />
                      {statusMeta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
