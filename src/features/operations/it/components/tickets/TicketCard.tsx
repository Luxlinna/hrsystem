import { memo } from "react";
import type { ITTicket } from "../../types";
import { TICKET_STATUS_CONFIG, PRIORITY_CONFIG } from "../../constants";

interface TicketCardProps {
  ticket: ITTicket;
  onSelect: (ticket: ITTicket) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (ticket: ITTicket) => void;
}

export const TicketCard = memo(function TicketCard({
  ticket,
  onSelect,
  onUpdateStatus,
  onDelete,
}: TicketCardProps) {
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.open;
  const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div
      id={`it-ticket-${ticket.id}`}
      onClick={() => onSelect(ticket)}
      className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 flex items-center gap-1 ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
            >
              <i className={priorityCfg.icon} />
              {priorityCfg.label}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
              {ticket.category}
            </span>
          </div>

          <span
            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border shrink-0 flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            <i className={statusCfg.icon} />
            {statusCfg.label}
          </span>
        </div>

        <h4 className="font-extrabold text-base text-gray-900 group-hover:text-[#253C7D] transition-colors line-clamp-1 mb-1">
          {ticket.title}
        </h4>

        {ticket.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {ticket.description}
          </p>
        )}

        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs mb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">Requested By:</span>
            <span className="font-bold text-gray-900 truncate">{ticket.requester_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">Logged At:</span>
            <span className="font-semibold text-gray-600 text-[11px]">
              {new Date(ticket.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {ticket.status === "open" && (
            <button
              onClick={() => onUpdateStatus(ticket.id, "in_progress")}
              className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-xl transition-colors cursor-pointer"
            >
              Start Work
            </button>
          )}

          {ticket.status === "in_progress" && (
            <button
              onClick={() => onUpdateStatus(ticket.id, "resolved")}
              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
            >
              Mark Resolved
            </button>
          )}

          {isResolved && (
            <button
              onClick={() => onUpdateStatus(ticket.id, "open")}
              className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
            >
              Reopen
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelect(ticket)}
            className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <i className="ri-eye-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(ticket)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Ticket"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
