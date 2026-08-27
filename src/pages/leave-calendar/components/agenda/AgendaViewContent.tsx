import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateDisplay, pageWindow } from "../../dateUtils";

interface AgendaViewContentProps {
  leaves: LeaveRequest[];
  totalRows: number;
  safeAgendaPage: number;
  totalAgendaPages: number;
  setAgendaPage: (p: number) => void;
  agendaPageSize: number;
  onInspectLeave: (l: LeaveRequest) => void;
}

export const AgendaViewContent = memo(function AgendaViewContent({
  leaves,
  totalRows,
  safeAgendaPage,
  totalAgendaPages,
  setAgendaPage,
  agendaPageSize,
  onInspectLeave,
}: AgendaViewContentProps) {
  if (totalRows === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-list-check" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Scheduled Leaves Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No absence records match the active search query or selected department filters.
        </p>
      </div>
    );
  }

  const pageStart = (safeAgendaPage - 1) * agendaPageSize + 1;
  const pageEnd = Math.min(safeAgendaPage * agendaPageSize, totalRows);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Leave Type</th>
              <th className="px-5 py-3.5">Dates</th>
              <th className="px-5 py-3.5">Days</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Reason</th>
              <th className="px-5 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaves.map((l) => {
              const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;

              return (
                <tr
                  key={l.id}
                  onClick={() => onInspectLeave(l)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                        {l.employees?.first_name?.[0]}
                        {l.employees?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-xs sm:text-[13px]">
                          {l.employees?.first_name} {l.employees?.last_name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {l.employees?.role || "Staff"} &middot; {l.employees?.department || "General"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg}`}>
                      <i className={cfg.icon} />
                      {cfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                    {formatDateDisplay(l.start_date)} &rarr; {formatDateDisplay(l.end_date)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                      {l.days} {l.days === 1 ? "day" : "days"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        l.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">
                    {l.reason || "—"}
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectLeave(l);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-eye-line text-sm" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>
          Showing <span className="font-bold text-gray-900">{pageStart}</span> to{" "}
          <span className="font-bold text-gray-900">{pageEnd}</span> of{" "}
          <span className="font-bold text-gray-900">{totalRows}</span> records
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAgendaPage(Math.max(1, safeAgendaPage - 1))}
            disabled={safeAgendaPage <= 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-arrow-left-s-line" />
          </button>

          {pageWindow(safeAgendaPage, totalAgendaPages).map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-bold">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => setAgendaPage(Number(p))}
                className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  safeAgendaPage === p
                    ? "bg-[#253C7D] text-white"
                    : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setAgendaPage(Math.min(totalAgendaPages, safeAgendaPage + 1))}
            disabled={safeAgendaPage >= totalAgendaPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>
    </div>
  );
});
