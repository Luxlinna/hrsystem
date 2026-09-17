import { memo } from "react";
import { OVERTIME_TYPES } from "../../types/overtimeTypes";

interface OvertimeFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  recordsCount: number;
  onExport: () => void;
  onOpenCreate: () => void;
}

export const OvertimeFilterBar = memo(function OvertimeFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  recordsCount,
  onExport,
  onOpenCreate,
}: OvertimeFilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-3.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Header Count & Add button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#253C7D]/10 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-300 rounded-xl font-bold text-xs border border-transparent dark:border-sky-800/40">
          <i className="ri-time-line text-sm" />
          <span>Overtime Logs</span>
          <span className="bg-[#253C7D] dark:bg-sky-500 text-white dark:text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
            {recordsCount}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3166] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <i className="ri-add-line text-sm" />
          <span>+ New Overtime</span>
        </button>
      </div>

      {/* Filters: Search, Type, Status, Export */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-48">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, reason..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Types</option>
          {OVERTIME_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
          title="Export to CSV"
        >
          <i className="ri-download-2-line text-xs text-[#253C7D] dark:text-sky-400" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
});
