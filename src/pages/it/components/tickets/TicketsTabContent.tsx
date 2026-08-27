import { memo } from "react";
import type { ITTicket } from "../../types";
import { TicketCard } from "./TicketCard";

interface TicketsTabContentProps {
  tickets: ITTicket[];
  onSelectTicket: (ticket: ITTicket) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteTicket: (ticket: ITTicket) => void;
  onOpenTicketModal: () => void;
}

export const TicketsTabContent = memo(function TicketsTabContent({
  tickets,
  onSelectTicket,
  onUpdateStatus,
  onDeleteTicket,
  onOpenTicketModal,
}: TicketsTabContentProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-customer-service-2-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No IT Tickets Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No incident or support tickets match your search query or selected priority and category filters.
        </p>
        <button
          onClick={onOpenTicketModal}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Log IT Support Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((t) => (
        <TicketCard
          key={t.id}
          ticket={t}
          onSelect={onSelectTicket}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDeleteTicket}
        />
      ))}
    </div>
  );
});
