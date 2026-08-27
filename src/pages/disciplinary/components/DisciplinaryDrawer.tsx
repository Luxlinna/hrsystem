import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from "../constants";

interface DisciplinaryDrawerProps {
  record: DisciplinaryRecord | null;
  canManage: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onDeleteRecord: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryDrawer = memo(function DisciplinaryDrawer({
  record: selectedRecord,
  canManage,
  onClose,
  onUpdateStatus,
  onDeleteRecord,
}: DisciplinaryDrawerProps) {
  if (!selectedRecord) return null;

  const typeCfg = TYPE_CONFIG[selectedRecord.type] || TYPE_CONFIG.verbal_warning;
  const sevCfg = SEVERITY_CONFIG[selectedRecord.severity] || SEVERITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[selectedRecord.status] || STATUS_CONFIG.open;
  const emp = selectedRecord.employees;
  const isOverdue =
    selectedRecord.follow_up_date &&
    selectedRecord.status !== "resolved" &&
    selectedRecord.status !== "closed" &&
    new Date(selectedRecord.follow_up_date + "T00:00:00") < new Date();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Drawer Top Header */}
        <div>
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color} flex items-center gap-1`}
              >
                <i className={typeCfg.icon} />
                {typeCfg.label}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${sevCfg.bg} ${sevCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                {sevCfg.label} Severity
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            {selectedRecord.resolved_at && (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <i className="ri-checkbox-circle-fill" />
                Resolved {new Date(selectedRecord.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Employee Profile Card */}
          {emp && (
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-gray-200/80 rounded-2xl">
              {emp.avatar_url ? (
                <img src={emp.avatar_url} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-sm font-black shrink-0">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-gray-900">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-gray-500">{emp.role}</p>
                <p className="text-[10px] text-gray-400 font-medium">{emp.department}</p>
              </div>
            </div>
          )}

          {/* Case Title */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Case Title
            </span>
            <h3 className="text-base font-black text-gray-900">{selectedRecord.title}</h3>
          </div>

          {/* Incident Description */}
          {selectedRecord.description && (
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Incident Summary &amp; Statement:
              </span>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedRecord.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
            {[
              {
                label: "Incident Date",
                value: selectedRecord.incident_date
                  ? new Date(selectedRecord.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—",
              },
              {
                label: "Follow-up Target Date",
                value: (
                  <span className={isOverdue ? "text-rose-600 font-black flex items-center gap-1" : "font-bold text-gray-800"}>
                    {selectedRecord.follow_up_date
                      ? new Date(selectedRecord.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "None set"}
                    {isOverdue && " (Overdue)"}
                  </span>
                ),
              },
              { label: "Logged By", value: selectedRecord.created_by },
              {
                label: "Filed On",
                value: new Date(selectedRecord.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-gray-400 font-medium">{row.label}</span>
                <span className="font-bold text-gray-800 text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Witnesses & Action Taken */}
          {selectedRecord.witnesses && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Witnesses Present:
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium">
                {selectedRecord.witnesses}
              </p>
            </div>
          )}

          {selectedRecord.action_taken && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Action Taken / Corrective Measures:
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-line">
                {selectedRecord.action_taken}
              </p>
            </div>
          )}

          {/* Performance Improvement Plan (PIP) Block */}
          {selectedRecord.type === "pip" && (
            <div className="border border-[#253C7D]/25 rounded-2xl p-4 bg-[#253C7D]/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-[#253C7D] uppercase tracking-wide flex items-center gap-1.5">
                  <i className="ri-focus-3-line" />
                  Performance Improvement Plan (PIP)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-[#253C7D]/15">
                  <span className="text-[10px] text-[#253C7D]/60 font-bold block mb-0.5">Start Date</span>
                  <span className="font-extrabold text-[#253C7D]">
                    {selectedRecord.pip_start_date
                      ? new Date(selectedRecord.pip_start_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#253C7D]/15">
                  <span className="text-[10px] text-[#253C7D]/60 font-bold block mb-0.5">End Date</span>
                  <span className="font-extrabold text-[#253C7D]">
                    {selectedRecord.pip_end_date
                      ? new Date(selectedRecord.pip_end_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>

              {selectedRecord.pip_goals && (
                <div className="p-3 bg-white rounded-xl border border-[#253C7D]/15 space-y-1">
                  <span className="text-[10px] text-[#253C7D]/60 font-bold uppercase tracking-wider block">
                    Key Milestones &amp; Measurable Goals:
                  </span>
                  <p className="text-xs text-[#253C7D] leading-relaxed whitespace-pre-line">
                    {selectedRecord.pip_goals}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Bottom Actions Footer */}
        <div className="p-4 border-t border-gray-100 bg-white space-y-2.5 shrink-0">
          {canManage && selectedRecord.status !== "resolved" && selectedRecord.status !== "closed" && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Progress Workflow:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {selectedRecord.status !== "in_progress" && (
                  <button
                    onClick={() => onUpdateStatus(selectedRecord.id, "in_progress")}
                    className="py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Mark In Progress
                  </button>
                )}
                {selectedRecord.status !== "escalated" && (
                  <button
                    onClick={() => onUpdateStatus(selectedRecord.id, "escalated")}
                    className="py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Escalate Case
                  </button>
                )}
                <button
                  onClick={() => onUpdateStatus(selectedRecord.id, "resolved")}
                  className="py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => onUpdateStatus(selectedRecord.id, "closed")}
                  className="py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close Case
                </button>
              </div>
            </div>
          )}

          {canManage && (
            <button
              onClick={() => onDeleteRecord(selectedRecord)}
              className="w-full py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <i className="ri-delete-bin-line" />
              Move to Recycle Bin
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
