import { memo } from "react";
import type { Offboarding } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { initials } from "../../offboardUtils";

interface OffboardListViewProps {
  offboardings: Offboarding[];
  onOpenEditModal: (o: Offboarding) => void;
  onDeleteOffboarding: (id: string, name: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const OffboardListView = memo(function OffboardListView({
  offboardings,
  onOpenEditModal,
  onDeleteOffboarding,
  onUpdateStatus,
}: OffboardListViewProps) {
  if (offboardings.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Branch / Dept</th>
              <th className="px-5 py-3.5">Last Working Day</th>
              <th className="px-5 py-3.5">Departure Reason</th>
              <th className="px-5 py-3.5">Tasks</th>
              <th className="px-5 py-3.5">Stage Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offboardings.map((o) => {
              const emp = o.employees;
              const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
              const statusCfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.notice_period;
              const completedTasks = (o.tasks || []).filter((t) => t.status === "completed").length;
              const totalTasks = (o.tasks || []).length;

              return (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                        {initials(emp?.first_name, emp?.last_name)}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-xs sm:text-[13px]">{fullName}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{emp?.role || "Staff"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                    {emp?.branches?.name || "HQ"} &middot; {emp?.department || "General"}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                    {o.last_day ? new Date(o.last_day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
                    {o.reason}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {completedTasks} / {totalTasks}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      <i className={statusCfg.icon} />
                      {statusCfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenEditModal(o)}
                        className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button
                        onClick={() => onDeleteOffboarding(o.id, fullName)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
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
