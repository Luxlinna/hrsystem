import { memo } from "react";
import type { ITTicket } from "../../types";
import { TICKET_STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants";

interface TicketDetailDrawerProps {
  selectedTicket: ITTicket | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteTicket: (ticket: ITTicket) => void;
}

export const TicketDetailDrawer = memo(function TicketDetailDrawer({
  selectedTicket,
  onClose,
  onUpdateStatus,
  onDeleteTicket,
}: TicketDetailDrawerProps) {
  if (!selectedTicket) return null;

  const statusCfg = TICKET_STATUS_CONFIG[selectedTicket.status] || TICKET_STATUS_CONFIG.open;
  const priorityCfg = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.medium;
  const isResolved = selectedTicket.status === "resolved" || selectedTicket.status === "closed";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">
                INCIDENT ID: #{selectedTicket.id.slice(0, 8)}
              </span>
              <h3 className="text-base font-extrabold text-gray-900 mt-0.5">IT Ticket Details</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Title & Category Banner */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border flex items-center gap-1 ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
                >
                  <i className={priorityCfg.icon} />
                  {priorityCfg.label}
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {selectedTicket.category}
                </span>
              </div>
              <h2 className="text-lg font-black text-gray-900 leading-snug">{selectedTicket.title}</h2>
            </div>

            {/* Current Status Pill */}
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Current Ticket State
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}
              >
                <i className={statusCfg.icon} />
                {statusCfg.label}
              </span>
            </div>

            {/* Requester & Timestamp Meta Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Requester
                </span>
                <p className="text-xs font-bold text-gray-900 mt-1 truncate">
                  {selectedTicket.requester_name}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Created At
                </span>
                <p className="text-xs font-bold text-gray-900 mt-1">
                  {new Date(selectedTicket.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Incident Description & Context
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-4 border border-gray-100 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description || "No detailed description provided by requester."}
              </p>
            </div>

            {/* Resolution Timestamp if present */}
            {selectedTicket.resolved_at && (
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs">
                <span className="text-emerald-800 font-bold block text-[11px]">Resolved On:</span>
                <p className="text-emerald-950 font-extrabold mt-0.5">
                  {new Date(selectedTicket.resolved_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-2.5">
          {selectedTicket.status === "open" && (
            <button
              onClick={() => onUpdateStatus(selectedTicket.id, "in_progress")}
              className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              Start Investigation
            </button>
          )}

          {selectedTicket.status === "in_progress" && (
            <button
              onClick={() => onUpdateStatus(selectedTicket.id, "resolved")}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              Mark Ticket as Resolved
            </button>
          )}

          {isResolved && (
            <button
              onClick={() => onUpdateStatus(selectedTicket.id, "open")}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              Reopen Incident Ticket
            </button>
          )}

          <button
            onClick={() => onDeleteTicket(selectedTicket)}
            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            title="Delete Ticket"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
