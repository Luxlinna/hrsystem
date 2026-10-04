import { memo } from "react";
import { DEPARTMENTS } from "../constants";

interface PayrollApprovalFilterBarProps {
  tab: "pending" | "approved" | "history" | "itemized" | "create";
  setTab: (tab: "pending" | "approved" | "history" | "itemized" | "create") => void;
  pendingCount: number;
  approvedCount: number;
  historyCount: number;
  itemizedCount: number;
  canManage: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  periodFilter: string;
  setPeriodFilter: (p: string) => void;
  deptFilter: string;
  setDeptFilter: (d: string) => void;
  periods: string[];
}

export const PayrollApprovalFilterBar = memo(function PayrollApprovalFilterBar({
  tab,
  setTab,
  pendingCount,
  approvedCount,
  historyCount,
  itemizedCount,
  canManage,
  searchQuery,
  setSearchQuery,
  periodFilter,
  setPeriodFilter,
  deptFilter,
  setDeptFilter,
  periods,
}: PayrollApprovalFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
          <button
            onClick={() => setTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "pending" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-time-line text-sm" />
            <span>Pending Authorization</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "pending" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setTab("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "approved" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-checkbox-circle-line text-sm text-emerald-600" />
            <span>Ready for Disbursement</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "history" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-history-line text-sm" />
            <span>Approval History</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "history" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}
            >
              {historyCount}
            </span>
          </button>

          <button
            onClick={() => setTab("itemized")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === "itemized" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-list-check-2 text-sm text-[#253C7D]" />
            <span>Itemized Records</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "itemized" ? "bg-[#253C7D]/15 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}
            >
              {itemizedCount}
            </span>
          </button>

          {canManage && (
            <button
              onClick={() => setTab("create")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "create" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-add-line text-sm" />
              <span>Create Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters: Search, Period & Department */}
      {tab !== "create" && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Search */}
          <div className="relative w-full sm:w-52">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runs or records..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Periods</option>
            {periods
              .filter((p) => p !== "all")
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d === "All Departments" ? "all" : d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
