import { memo, useState, useRef, useEffect } from "react";

interface ExitSettingFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusChange: (status: "all" | "active" | "inactive") => void;
}

export const ExitSettingFilterBar = memo(function ExitSettingFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: ExitSettingFilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusLabel =
    statusFilter === "all" ? "Status" : statusFilter === "active" ? "Active" : "Inactive";

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      {/* Search Input with attached Search Button */}
      <div className="flex items-center w-full max-w-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-l-lg focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 outline-none text-gray-800 dark:text-slate-100 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Search"
          className="h-8 px-3 bg-[#253C7D] hover:bg-[#1f3166] text-white text-xs font-semibold rounded-r-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Status Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-1.5 h-8 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
        >
          <span>{statusLabel}</span>
          <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onStatusChange("all");
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                statusFilter === "all"
                  ? "bg-[#253C7D]/5 text-[#253C7D] font-bold dark:text-sky-400"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span>All Status</span>
              {statusFilter === "all" && <i className="ri-check-line text-xs" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onStatusChange("active");
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                statusFilter === "active"
                  ? "bg-[#253C7D]/5 text-[#253C7D] font-bold dark:text-sky-400"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span>Active</span>
              {statusFilter === "active" && <i className="ri-check-line text-xs" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onStatusChange("inactive");
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                statusFilter === "inactive"
                  ? "bg-[#253C7D]/5 text-[#253C7D] font-bold dark:text-sky-400"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span>Inactive</span>
              {statusFilter === "inactive" && <i className="ri-check-line text-xs" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
