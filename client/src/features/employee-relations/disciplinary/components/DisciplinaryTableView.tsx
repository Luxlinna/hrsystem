import { memo, useState } from "react";
import type { DisciplinaryRecord } from "../types";
import { formatDateDMY, formatMultilinePreview } from "../utils/formatters";
import { WarningRowMenu } from "./WarningRowMenu";

interface DisciplinaryTableViewProps {
  records: DisciplinaryRecord[];
  onSelectRecord: (record: DisciplinaryRecord) => void;
  onEditRecord?: (record: DisciplinaryRecord) => void;
  onVoidRecord?: (record: DisciplinaryRecord) => void;
  onDeleteRecord?: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryTableView = memo(function DisciplinaryTableView({
  records,
  onSelectRecord,
  onEditRecord,
  onVoidRecord,
  onDeleteRecord,
}: DisciplinaryTableViewProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
        No warning records found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold text-xs">
              <th className="px-4 py-3.5 w-14">No.</th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Warning Type</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <div className="leading-tight">
                    <div>Warning</div>
                    <div>Date</div>
                  </div>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Employee</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 min-w-[220px]">
                <div className="flex items-center gap-1">
                  <span>Description of Violation</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 min-w-[220px]">
                <div className="flex items-center gap-1">
                  <span>Employee Promise</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-center w-24 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, idx) => {
              const emp = r.employees;
              const warningType = r.warning_type || r.type || "Warning";
              const warningDate = formatDateDMY(r.warning_date || r.incident_date);
              const violationText = formatMultilinePreview(r.description);
              const promiseText = formatMultilinePreview(r.employee_promise);
              const isVoided = r.status === "voided" || r.status === "void";

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 text-slate-500 font-semibold align-top">{idx + 1}</td>

                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap align-top">
                    {warningType}
                  </td>

                  <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap align-top">
                    {warningDate}
                  </td>

                  {/* Employee */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    <div className="flex items-center gap-2.5">
                      {emp?.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs font-black shrink-0">
                          {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-[#253C7D] transition-colors leading-tight">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </p>
                        {emp?.employee_id && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-200 text-slate-600 bg-white">
                            {emp.employee_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Description of Violation */}
                  <td className="px-4 py-3 max-w-xs align-top">
                    <div className="text-slate-700 whitespace-pre-line line-clamp-3 leading-relaxed font-['Kantumruy_Pro',sans-serif]" title={violationText}>
                      {violationText}
                    </div>
                  </td>

                  {/* Employee Promise */}
                  <td className="px-4 py-3 max-w-xs align-top">
                    <div className="text-slate-700 whitespace-pre-line line-clamp-3 leading-relaxed font-['Kantumruy_Pro',sans-serif]" title={promiseText}>
                      {promiseText}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center whitespace-nowrap align-top">
                    {isVoided ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600">
                        Voided
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#20B2AA] text-white">
                        Recorded
                      </span>
                    )}
                  </td>

                  {/* Action Settings Menu */}
                  <td
                    className="px-4 py-3 text-right whitespace-nowrap relative align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === r.id ? null : r.id)}
                      className="w-7 h-7 inline-flex items-center justify-center border border-sky-500 text-sky-500 hover:bg-sky-50 rounded cursor-pointer transition-colors"
                      title="Settings"
                    >
                      <i className="ri-settings-3-line text-sm" />
                    </button>

                    <WarningRowMenu
                      isOpen={activeMenuId === r.id}
                      onClose={() => setActiveMenuId(null)}
                      record={r}
                      onView={onSelectRecord}
                      onEdit={onEditRecord}
                      onVoid={onVoidRecord}
                      onDelete={onDeleteRecord}
                    />
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
