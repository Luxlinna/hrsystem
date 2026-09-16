import { memo } from "react";
import type { EmployeeExit } from "../types";
import { EXIT_TYPE_CONFIG, REASON_TYPE_CONFIG } from "../constants";

interface ExitTableProps {
  exits: EmployeeExit[];
  loading: boolean;
  onEdit: (exit: EmployeeExit) => void;
  onDelete: (id: string) => void;
  onRecord: () => void;
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function ExitTypeBadge({ type }: { type: EmployeeExit["exit_type"] }) {
  const cfg = EXIT_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <i className={`${cfg.icon} text-[10px]`} />
      {cfg.label}
    </span>
  );
}

export const ExitTable = memo(function ExitTable({
  exits, loading, onEdit, onDelete, onRecord,
}: ExitTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading exit records…</p>
        </div>
      </div>
    );
  }

  if (exits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <i className="ri-logout-box-r-line text-3xl text-gray-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700">No exit records found</p>
          <p className="text-xs text-gray-400 mt-1">Record an employee exit to get started.</p>
        </div>
        <button
          onClick={onRecord}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg"
          style={{ background: "linear-gradient(135deg,#253C7D,#3554a5)" }}
        >
          <i className="ri-add-line" />Record First Exit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Exit Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Working Day</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Recorded By</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exits.map((ex) => {
              const emp = ex.employees;
              const firstName = emp?.first_name ?? "Unknown";
              const lastName  = emp?.last_name  ?? "";
              return (
                <tr key={ex.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Employee */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {emp?.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#253C7D]">
                          {initials(firstName, lastName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-gray-900 truncate">{firstName} {lastName}</p>
                          {ex.is_blacklisted && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Blacklisted
                            </span>
                          )}
                          {emp?.branches?.name && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-[#253C7D] border border-blue-100">
                              {emp.branches.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{emp?.role ?? "—"} · {emp?.department ?? "—"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Exit Type */}
                  <td className="px-4 py-3.5">
                    <ExitTypeBadge type={ex.exit_type} />
                  </td>

                  {/* Last Working Day */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-gray-800">{ex.last_working_day}</span>
                  </td>

                  {/* Reason Type */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-600">{REASON_TYPE_CONFIG[ex.reason_type]?.label ?? ex.reason_type}</span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3.5 max-w-48">
                    <p className="text-xs text-gray-500 truncate" title={ex.reason_description ?? ""}>
                      {ex.reason_description || <span className="text-gray-300">—</span>}
                    </p>
                  </td>

                  {/* Document */}
                  <td className="px-4 py-3.5">
                    {ex.document_url ? (
                      <a
                        href={ex.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#253C7D] hover:underline"
                      >
                        <i className="ri-attachment-2 text-xs" />
                        <span className="truncate max-w-28">{ex.document_name || "View"}</span>
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Recorded By */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-500">{ex.recorded_by || "—"}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(ex)}
                        className="w-7 h-7 rounded-lg bg-[#253C7D]/8 hover:bg-[#253C7D]/15 text-[#253C7D] flex items-center justify-center cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <i className="ri-pencil-line text-xs" />
                      </button>
                      <button
                        onClick={() => onDelete(ex.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
        <p className="text-xs text-gray-400">Showing {exits.length} exit record{exits.length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
});
