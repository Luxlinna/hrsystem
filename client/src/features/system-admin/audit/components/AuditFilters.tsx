import { memo, useState, useRef, useEffect } from "react";
import { MODULES, ACTION_ICONS, ACTION_COLORS } from "../constants";
import type { CrossBuScopeFilter } from "../types";

interface AuditFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  moduleFilter: string;
  setModuleFilter: (module: string) => void;
  actionFilter: string;
  setActionFilter: (action: string) => void;
  buFilter: string;
  setBuFilter: (bu: string) => void;
  availableBusinessUnits: string[];
  scopeFilter: CrossBuScopeFilter;
  setScopeFilter: (scope: CrossBuScopeFilter) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  onClearAll: () => void;
}

const SCOPE_CONFIG: {
  value: CrossBuScopeFilter;
  label: string;
  icon: string;
}[] = [
  { value: "all", label: "All Scopes", icon: "ri-organization-chart" },
  { value: "local", label: "Local BU Actions", icon: "ri-building-line" },
  { value: "cross_bu", label: "Across-Site BU Actions", icon: "ri-arrow-left-right-line" },
];

const MODULE_ICONS: Record<string, string> = {
  all: "ri-apps-2-line",
  hire: "ri-user-add-line",
  leave: "ri-calendar-event-line",
  payroll: "ri-money-dollar-circle-line",
  onboarding: "ri-user-shared-line",
  employees: "ri-team-line",
  offboard: "ri-user-unfollow-line",
  it: "ri-computer-line",
  finance: "ri-bank-card-line",
  benefits: "ri-gift-line",
  tools: "ri-tools-line",
  unity: "ri-apps-line",
  branches: "ri-store-2-line",
  settings: "ri-settings-3-line",
};

export const AuditFilters = memo(function AuditFilters({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  actionFilter,
  setActionFilter,
  buFilter,
  setBuFilter,
  availableBusinessUnits,
  scopeFilter,
  setScopeFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onClearAll,
}: AuditFiltersProps) {
  const [activeDropdown, setActiveDropdown] = useState<"bu" | "scope" | "module" | "action" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isFiltered =
    moduleFilter !== "all" ||
    actionFilter !== "all" ||
    buFilter !== "all" ||
    scopeFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(search);

  const activeScope = SCOPE_CONFIG.find((s) => s.value === scopeFilter) || SCOPE_CONFIG[0];
  const activeActionIcon = actionFilter !== "all" ? (ACTION_ICONS[actionFilter] || "ri-record-circle-line") : "ri-sound-module-line";
  const activeActionColor = actionFilter !== "all" ? (ACTION_COLORS[actionFilter] || "text-gray-500") : "text-slate-500";
  const activeModuleIcon = MODULE_ICONS[moduleFilter] || "ri-apps-2-line";

  return (
    <div
      ref={containerRef}
      className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center relative z-20"
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search logs, actor, BU, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[38px] pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 placeholder-gray-400"
        />
      </div>

      {/* BU (Business Unit) Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown((prev) => (prev === "bu" ? null : "bu"))}
          className={`h-[38px] px-3 border rounded-lg text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 max-w-[220px] ${
            buFilter !== "all"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70"
          }`}
          title={buFilter === "all" ? "All Business Units (BU)" : buFilter}
        >
          <i
            className={`${
              buFilter !== "all" ? "ri-building-2-line text-blue-600" : "ri-building-line text-slate-500"
            } text-base shrink-0`}
          />
          <span className="truncate">
            {buFilter === "all" ? "All Business Units (BU)" : buFilter}
          </span>
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base shrink-0 transition-transform duration-150 ${
              activeDropdown === "bu" ? "rotate-180" : ""
            }`}
          />
        </button>

        {activeDropdown === "bu" && (
          <div className="absolute left-0 top-full mt-1.5 w-64 max-h-72 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
            <button
              type="button"
              onClick={() => {
                setBuFilter("all");
                setActiveDropdown(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left cursor-pointer ${
                buFilter === "all"
                  ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <i className="ri-building-line text-slate-500 text-base shrink-0" />
                <span className="truncate">All Business Units (BU)</span>
              </div>
              {buFilter === "all" && <i className="ri-check-line text-[#253C7D] font-bold text-sm shrink-0" />}
            </button>

            {availableBusinessUnits.length > 0 && (
              <div className="my-1 border-t border-gray-100" />
            )}

            {availableBusinessUnits.map((bu) => {
              const isSelected = buFilter === bu;
              return (
                <button
                  key={bu}
                  type="button"
                  onClick={() => {
                    setBuFilter(bu);
                    setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <i className="ri-building-2-line text-slate-400 text-base shrink-0" />
                    <span className="truncate">{bu}</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-sm shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cross-BU Scope Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown((prev) => (prev === "scope" ? null : "scope"))}
          className={`h-[38px] px-3 border rounded-lg text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            scopeFilter !== "all"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70"
          }`}
        >
          <i
            className={`${activeScope.icon} ${
              scopeFilter !== "all" ? "text-blue-600" : "text-slate-500"
            } text-base shrink-0`}
          />
          <span>{activeScope.label}</span>
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base shrink-0 transition-transform duration-150 ${
              activeDropdown === "scope" ? "rotate-180" : ""
            }`}
          />
        </button>

        {activeDropdown === "scope" && (
          <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
            {SCOPE_CONFIG.map((opt) => {
              const isSelected = scopeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScopeFilter(opt.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <i
                      className={`${opt.icon} ${
                        isSelected ? "text-[#253C7D]" : "text-slate-400"
                      } text-base shrink-0`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-sm shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Module Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown((prev) => (prev === "module" ? null : "module"))}
          className={`h-[38px] px-3 border rounded-lg text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            moduleFilter !== "all"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70"
          }`}
        >
          <i className={`${activeModuleIcon} ${moduleFilter !== "all" ? "text-blue-600" : "text-slate-500"} text-base shrink-0`} />
          <span className="capitalize">
            {moduleFilter === "all" ? "All Modules" : moduleFilter}
          </span>
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base shrink-0 transition-transform duration-150 ${
              activeDropdown === "module" ? "rotate-180" : ""
            }`}
          />
        </button>

        {activeDropdown === "module" && (
          <div className="absolute left-0 top-full mt-1.5 w-52 max-h-72 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
            {MODULES.map((m) => {
              const isSelected = moduleFilter === m;
              const icon = MODULE_ICONS[m] || "ri-apps-2-line";
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setModuleFilter(m);
                    setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <i className={`${icon} ${isSelected ? "text-[#253C7D]" : "text-slate-400"} text-base shrink-0`} />
                    <span className="capitalize">{m === "all" ? "All Modules" : m}</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-sm shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown((prev) => (prev === "action" ? null : "action"))}
          className={`h-[38px] px-3 border rounded-lg text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            actionFilter !== "all"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70"
          }`}
        >
          <i className={`${activeActionIcon} ${activeActionColor} text-base shrink-0`} />
          <span className="capitalize">
            {actionFilter === "all" ? "All Actions" : actionFilter}
          </span>
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base shrink-0 transition-transform duration-150 ${
              activeDropdown === "action" ? "rotate-180" : ""
            }`}
          />
        </button>

        {activeDropdown === "action" && (
          <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
            {["all", "created", "updated", "approved", "rejected", "deleted", "processed"].map((a) => {
              const isSelected = actionFilter === a;
              const icon = a === "all" ? "ri-sound-module-line" : (ACTION_ICONS[a] || "ri-record-circle-line");
              const iconColor = a === "all" ? "text-slate-500" : (ACTION_COLORS[a] || "text-gray-500");
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setActionFilter(a);
                    setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <i className={`${icon} ${iconColor} text-base shrink-0`} />
                    <span className="capitalize">{a === "all" ? "All Actions" : a}</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-sm shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Date Pickers */}
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer text-gray-700"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer text-gray-700"
      />

      {/* Clear All */}
      {isFiltered && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-[38px] px-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-filter-off-line text-base" />
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
});
