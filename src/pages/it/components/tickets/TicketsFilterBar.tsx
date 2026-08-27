import { memo } from "react";
import { TICKET_CATEGORIES } from "../../constants";

interface TicketsFilterBarProps {
  ticketSearch: string;
  setTicketSearch: (query: string) => void;
  ticketStatusFilter: string;
  setTicketStatusFilter: (status: string) => void;
  ticketPriorityFilter: string;
  setTicketPriorityFilter: (priority: string) => void;
  ticketCategoryFilter: string;
  setTicketCategoryFilter: (category: string) => void;
}

export const TicketsFilterBar = memo(function TicketsFilterBar({
  ticketSearch,
  setTicketSearch,
  ticketStatusFilter,
  setTicketStatusFilter,
  ticketPriorityFilter,
  setTicketPriorityFilter,
  ticketCategoryFilter,
  setTicketCategoryFilter,
}: TicketsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={ticketSearch}
          onChange={(e) => setTicketSearch(e.target.value)}
          placeholder="Search incident tickets by subject, requester, category, issue ID..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {ticketSearch && (
          <button
            onClick={() => setTicketSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={ticketStatusFilter}
          onChange={(e) => setTicketStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={ticketPriorityFilter}
          onChange={(e) => setTicketPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={ticketCategoryFilter}
          onChange={(e) => setTicketCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[140px] truncate"
        >
          <option value="all">All Categories</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
