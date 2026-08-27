import { memo } from "react";

interface ITStatsRowProps {
  activeAssets: number;
  inInventory: number;
  openTickets: number;
  criticalTickets: number;
  onSelectTab: (tab: "assets" | "tickets") => void;
}

export const ITStatsRow = memo(function ITStatsRow({
  activeAssets,
  inInventory,
  openTickets,
  criticalTickets,
  onSelectTab,
}: ITStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Active Assets */}
      <div
        onClick={() => onSelectTab("assets")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Assets</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-macbook-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{activeAssets}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Deployed to employees</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* In Inventory */}
      <div
        onClick={() => onSelectTab("assets")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">In Stock / Pool</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-archive-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-700 mt-2">{inInventory}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Available for deployment</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
      </div>

      {/* Open Helpdesk Tickets */}
      <div
        onClick={() => onSelectTab("tickets")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Open Tickets</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-customer-service-2-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{openTickets}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Pending IT resolution</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Urgent / Critical Tickets */}
      <div
        onClick={() => onSelectTab("tickets")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgent Incidents</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-alarm-warning-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{criticalTickets}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">High/Critical priority</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>
    </div>
  );
});
