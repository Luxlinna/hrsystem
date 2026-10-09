import React, { useState, useMemo } from "react";
import type { ITAsset, ITTabType } from "../../types";
import { AssetNavDropdown } from "../navigation/AssetNavDropdown";

interface AssetHistoryTabContentProps {
  assets: ITAsset[];
  onSelectTab: (tab: ITTabType) => void;
}

export const AssetHistoryTabContent: React.FC<AssetHistoryTabContentProps> = ({
  assets,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  // Sample history logs derived from assets
  const historyLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      timestamp: string;
      assetName: string;
      action: "Created" | "Assigned" | "Returned" | "Status Change" | "Maintenance";
      performedBy: string;
      details: string;
    }> = [];

    assets.forEach((a, i) => {
      logs.push({
        id: `log-${a.id}-create`,
        timestamp: a.created_at || a.purchase_date || `2026-01-${String(10 + (i % 15)).padStart(2, "0")} 09:30 AM`,
        assetName: a.name,
        action: "Created",
        performedBy: "IT Admin",
        details: `Initial entry recorded under tag ${a.asset_tag}`,
      });

      if (a.employee_id || a.status === "active") {
        logs.push({
          id: `log-${a.id}-assign`,
          timestamp: `2026-02-${String(1 + (i % 20)).padStart(2, "0")} 14:15 PM`,
          assetName: a.name,
          action: "Assigned",
          performedBy: "IT Admin",
          details: `Dispatched to ${a.employees ? `${a.employees.last_name} ${a.employees.first_name}` : "Staff"}`,
        });
      }

      if (a.status === "maintenance") {
        logs.push({
          id: `log-${a.id}-maint`,
          timestamp: `2026-03-${String(1 + (i % 25)).padStart(2, "0")} 11:00 AM`,
          assetName: a.name,
          action: "Maintenance",
          performedBy: "Hardware Tech",
          details: "Hardware servicing and diagnostics check initiated.",
        });
      }
    });

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [assets]);

  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      if (actionFilter !== "All" && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          log.assetName.toLowerCase().includes(q) ||
          log.performedBy.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [historyLogs, searchQuery, actionFilter]);

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-normal text-slate-700 tracking-tight">History</h1>
      </div>

      {/* Asset Navigation Trigger on left */}
      <div className="flex items-center gap-4">
        <AssetNavDropdown currentTab="history" onSelectTab={onSelectTab} />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent">
        {/* Search */}
        <div className="flex items-center rounded-sm border border-slate-300 focus-within:border-[#253C7D] bg-white overflow-hidden shadow-2xs max-w-xs w-full transition-colors h-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="ri-close-line text-xs" />
            </button>
          )}
          <div className="bg-[#253C7D] text-white px-3 h-full flex items-center justify-center">
            <i className="ri-search-line text-xs" />
          </div>
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2">
          {(["All", "Created", "Assigned", "Returned", "Maintenance"] as const).map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                actionFilter === act
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-sm shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
              <th className="px-4 py-3 w-14">No.</th>
              <th className="px-4 py-3 w-40">Date & Time</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3 w-32">Action</th>
              <th className="px-4 py-3 w-36">Performed By</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 px-4 text-center bg-[#f4f6f9] border-t border-slate-200 text-xs font-bold text-slate-700"
                >
                  No records found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.assetName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        log.action === "Created"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : log.action === "Assigned"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : log.action === "Maintenance"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{log.performedBy}</td>
                  <td className="px-4 py-3 text-slate-600">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
