import React from "react";
import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";

interface MovementDetailModalProps {
  movement: EmployeeMovement | null;
  onClose: () => void;
}

export const MovementDetailModal: React.FC<MovementDetailModalProps> = ({
  movement,
  onClose,
}) => {
  if (!movement) return null;

  const emp = movement.employees;
  const typeConfig = MOVEMENT_TYPES[movement.movement_type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${typeConfig?.badgeBg} ${typeConfig?.badgeText}`}>
              <i className={typeConfig?.icon || "ri-route-line"} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Movement Details
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Action Ref: {movement.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Employee profile strip */}
          <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {emp?.avatar_url ? (
                <img
                  src={emp.avatar_url}
                  alt={emp.first_name}
                  className="w-9 h-9 rounded-full object-cover border border-white dark:border-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold flex items-center justify-center text-xs">
                  {emp?.first_name?.[0]}
                  {emp?.last_name?.[0]}
                </div>
              )}
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee"}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {emp?.role || "Staff"} &bull; {emp?.department || "General"}
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                typeConfig
                  ? `${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {typeConfig?.label || movement.movement_type}
            </span>
          </div>

          {/* Action Title & Date */}
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {movement.title}
            </div>
            <div className="text-gray-500 text-[11px] flex items-center gap-2">
              <span>Effective Date: <strong>{movement.effective_date}</strong></span>
              &bull;
              <span>Recorded: <strong>{new Date(movement.created_at).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Before vs After comparison grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-rose-100 dark:border-rose-950/50 bg-rose-50/30 dark:bg-rose-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                Previous Baseline
              </span>
              <div className="space-y-1 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                {Object.entries(movement.previous_values || {}).length > 0 ? (
                  Object.entries(movement.previous_values).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-gray-400 capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                      <strong>{String(v)}</strong>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 italic">No prior data recorded</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                New Assigned Values
              </span>
              <div className="space-y-1 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                {Object.entries(movement.new_values || {}).length > 0 ? (
                  Object.entries(movement.new_values).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-gray-400 capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400">{String(v)}</strong>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 italic">No changes specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {movement.remarks && (
            <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Remarks / Reason
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "{movement.remarks}"
              </p>
            </div>
          )}

          {/* Supporting Document */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Supporting Attachment
            </div>
            {movement.document_url ? (
              <a
                href={movement.document_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <i className="ri-file-text-line text-base text-[#253C7D] dark:text-indigo-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {movement.document_name || "Download Attached Document"}
                  </span>
                </div>
                <i className="ri-external-link-line text-sm text-[#253C7D] dark:text-indigo-400" />
              </a>
            ) : (
              <div className="text-gray-400 italic p-2 bg-gray-50 dark:bg-slate-800/40 rounded-lg text-center">
                No supporting file attached to this movement.
              </div>
            )}
          </div>

          <div className="pt-2 text-right text-[11px] text-gray-400">
            Action logged by: <span className="font-semibold text-gray-600 dark:text-gray-300">{movement.created_by_name || "HR Admin"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end bg-gray-50/30 dark:bg-slate-800/20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
