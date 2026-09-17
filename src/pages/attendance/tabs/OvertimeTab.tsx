import { memo, useState, useMemo } from "react";
import type { OvertimeRecord } from "../types/overtimeTypes";
import { OVERTIME_STATUS_CONFIG } from "../types/overtimeTypes";
import { OvertimeFilterBar } from "../components/overtime/OvertimeFilterBar";
import { formatTime, initials } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";

interface OvertimeTabProps {
  records: OvertimeRecord[];
  canManage: boolean;
  canManageSettings?: boolean;
  onOpenCreate: () => void;
  onCreateNew?: () => void;
  onCreateRequest?: () => void;
  onCreateRequestFor?: () => void;
  onOpenSettings?: () => void;
  onExport: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OvertimeTab = memo(function OvertimeTab({
  records,
  canManage,
  canManageSettings = false,
  onOpenCreate,
  onCreateNew,
  onCreateRequest,
  onCreateRequestFor,
  onOpenSettings,
  onExport,
  onApprove,
  onReject,
  onDelete,
}: OvertimeTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== "all" && r.overtime_type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        const remark = (r.remark || "").toLowerCase();
        if (!empName.includes(q) && !reason.includes(q) && !remark.includes(q)) return false;
      }
      return true;
    });
  }, [records, filterType, filterStatus, searchQuery]);

  return (
    <div>
      <OvertimeFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        recordsCount={filtered.length}
        onExport={onExport}
        onOpenCreate={onOpenCreate}
        onCreateNew={onCreateNew}
        onCreateRequest={onCreateRequest}
        onCreateRequestFor={onCreateRequestFor}
        onOpenSettings={onOpenSettings}
        canManage={canManage}
        canManageSettings={canManageSettings}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-time-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">No Overtime Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No overtime entries match your filter criteria. Click "+ New Overtime" to submit an overtime record.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/90 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Employee</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Type &amp; Period</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Date(s)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Time In / Out</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Reason &amp; Remark</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Attachment</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  {canManage && <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map((r) => {
                  const emp = r.employees;
                  const cfg = OVERTIME_STATUS_CONFIG[r.status] || OVERTIME_STATUS_CONFIG.pending;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp?.first_name, emp?.last_name)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-gray-900 dark:text-slate-100">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</p>
                              {emp?.biometric_user_id ? (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                                  title={`BU Biometric ID: ${emp.biometric_user_id}`}
                                >
                                  <i className="ri-fingerprint-line text-[10px]" />
                                  {formatBiometricId(emp.biometric_user_id, emp.branches?.name)}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{emp?.role || emp?.department || "Staff"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Period */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-slate-100 block">{r.overtime_type}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#253C7D] dark:text-sky-300 bg-indigo-50/70 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md mt-0.5">
                          <i className="ri-timer-line text-xs" /> {r.overtime_hours} Hours
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-800 dark:text-slate-200 block">{r.from_date}</span>
                        {r.to_date !== r.from_date && <span className="text-[10px] text-gray-400">to {r.to_date}</span>}
                      </td>

                      {/* Time In / Out */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-slate-700">
                          <span>{formatTime(r.time_in)}</span>
                          <span className="text-gray-400">→</span>
                          <span>{formatTime(r.time_out)}</span>
                        </div>
                        {r.break_minutes > 0 && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">Break: {r.break_minutes}m</span>
                        )}
                      </td>

                      {/* Reason & Remark */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-gray-800 dark:text-slate-200 line-clamp-2">{r.reason}</p>
                        {r.remark && <p className="text-[10px] text-gray-400 italic truncate mt-0.5">"{r.remark}"</p>}
                      </td>

                      {/* Attachment */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.attachment_url ? (
                          <a
                            href={r.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                          >
                            <i className="ri-file-download-line text-xs" />
                            <span>{r.attachment_name || "File"}</span>
                          </a>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          <i className={cfg.icon} />
                          <span>{cfg.label}</span>
                        </span>
                        {r.status === "approved" && r.approved_at && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                            {new Date(r.approved_at).toLocaleDateString()}
                          </p>
                        )}
                        {r.status === "rejected" && r.rejection_reason && (
                          <p className="text-[10px] text-rose-400 italic mt-0.5 max-w-[120px] truncate" title={r.rejection_reason}>
                            {r.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onApprove(r.id)}
                                  className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                  title="Approve Overtime"
                                >
                                  <i className="ri-checkbox-circle-line text-base" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onReject(r.id)}
                                  className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Reject Overtime"
                                >
                                  <i className="ri-close-circle-line text-base" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => onDelete(r.id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
