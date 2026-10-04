import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from "../constants";
import { DisciplinaryDrawerBody } from "./DisciplinaryDrawerBody";

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
  const isOverdue =
    Boolean(selectedRecord.follow_up_date) &&
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
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color} flex items-center gap-1`}>
                <i className={typeCfg.icon} />
                {typeCfg.label}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${sevCfg.bg} ${sevCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                {sevCfg.label} Severity
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

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

        {/* Drawer Body */}
        <DisciplinaryDrawerBody record={selectedRecord} isOverdue={isOverdue} />

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2 shrink-0">
          {canManage ? (
            <>
              <div className="flex items-center gap-2">
                {selectedRecord.status !== "resolved" && selectedRecord.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(selectedRecord.id, "resolved")}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-checkbox-circle-line" />
                    Mark Resolved
                  </button>
                )}
                {selectedRecord.status === "open" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(selectedRecord.id, "in_progress")}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-time-line" />
                    In Progress
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteRecord(selectedRecord)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Move to Recycle Bin"
              >
                <i className="ri-delete-bin-line text-base" />
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Read-only view</span>
          )}
        </div>
      </div>
    </div>
  );
});
