import React from "react";
import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";

interface MovementsTableViewProps {
  movements: EmployeeMovement[];
  onSelectMovement: (movement: EmployeeMovement) => void;
}

export const MovementsTableView: React.FC<MovementsTableViewProps> = ({
  movements,
  onSelectMovement,
}) => {
  if (movements.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <i className="ri-route-line text-2xl" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Movement Records Found</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          No employee career movements match your current search or filter criteria. Click "Record Movement" to log a new transition.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-slate-900/60 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-4 font-semibold">Movement Type</th>
              <th className="py-3 px-4 font-semibold">Transition Details</th>
              <th className="py-3 px-4 font-semibold">Effective Date</th>
              <th className="py-3 px-4 font-semibold">Supporting Document</th>
              <th className="py-3 px-4 font-semibold">Actioned By</th>
              <th className="py-3 px-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {movements.map((m) => {
              const emp = m.employees;
              const typeConfig = MOVEMENT_TYPES[m.movement_type];
              const initials = emp
                ? `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase()
                : "EM";

              // Summarize transition
              const prevText = Object.entries(m.previous_values || {})
                .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                .join(", ");
              const newText = Object.entries(m.new_values || {})
                .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                .join(", ");

              return (
                <tr
                  key={m.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectMovement(m)}
                >
                  {/* Employee Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {emp?.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt={emp.first_name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] dark:bg-indigo-900/40 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px]">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#253C7D] dark:group-hover:text-indigo-400 transition-colors">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff"}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">
                          {emp?.role || "Staff"} &bull; {emp?.department || "General"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Movement Type Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border text-[11px] ${
                        typeConfig
                          ? `${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {typeConfig && <i className={typeConfig.icon} />}
                      <span>{typeConfig?.label || m.movement_type}</span>
                    </span>
                  </td>

                  {/* Transition Details */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {m.title}
                    </div>
                    {(prevText || newText) && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span className="line-through opacity-70 truncate max-w-[120px]">{prevText || "Initial"}</span>
                        <i className="ri-arrow-right-line text-xs text-gray-400 shrink-0" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">{newText || "Updated"}</span>
                      </div>
                    )}
                  </td>

                  {/* Effective Date */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {m.effective_date}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Supporting Document */}
                  <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {m.document_url ? (
                      <a
                        href={m.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#253C7D] dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all"
                      >
                        <i className="ri-attachment-2 text-xs" />
                        <span className="max-w-[110px] truncate">{m.document_name || "View Document"}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-[11px] italic">No document</span>
                    )}
                  </td>

                  {/* Actioned By */}
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-[11px]">
                    {m.created_by_name || "HR Admin"}
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMovement(m);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-all"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
