import React, { useState, useMemo } from "react";
import type { LeaveTypeSetting } from "../../services/leaveSettingsService";
import { LeaveEntitlementRulesTabContent } from "./LeaveEntitlementRulesTabContent";
import { LeaveApprovalFlowTabContent } from "./approval-flow/LeaveApprovalFlowTabContent";

interface LeaveSettingsViewProps {
  leaveTypes: LeaveTypeSetting[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  canModify?: boolean;
  employees?: Array<{ id: string; nationality?: string | null; first_name?: string; last_name?: string; role?: string; department?: string; full_name?: string }>;
  availableLeaveCodes?: string[];
  onCreateNew: () => void;
  onEdit: (type: LeaveTypeSetting) => void;
  onDelete: (id: string, name: string) => void;
  onToggleActive: (type: LeaveTypeSetting) => void;
  onBack: () => void;
}

type LeaveSystemTab =
  | "leave_type"
  | "entitlement_rule"
  | "blackout_date"
  | "compensatory_rule"
  | "leave_hourly"
  | "approval_flow"
  | "settings";

const VALID_SETTINGS_TABS: LeaveSystemTab[] = [
  "leave_type",
  "entitlement_rule",
  "blackout_date",
  "compensatory_rule",
  "leave_hourly",
  "approval_flow",
  "settings",
];

function getInitialSettingsTab(): LeaveSystemTab {
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab")?.replace(/-/g, "_") as LeaveSystemTab;
    if (tabParam && VALID_SETTINGS_TABS.includes(tabParam)) {
      return tabParam;
    }
    const hash = window.location.hash?.replace(/^#/, "").replace(/-/g, "_") as LeaveSystemTab;
    if (hash && VALID_SETTINGS_TABS.includes(hash)) {
      return hash;
    }
    const stored = localStorage.getItem("hrsystem_leave_settings_active_tab") as LeaveSystemTab;
    if (stored && VALID_SETTINGS_TABS.includes(stored)) {
      return stored;
    }
  } catch {
    // fallback
  }
  return "leave_type";
}

export const LeaveSettingsView: React.FC<LeaveSettingsViewProps> = ({
  leaveTypes,
  loading,
  searchQuery,
  setSearchQuery,
  canModify = false,
  employees = [],
  availableLeaveCodes,
  onCreateNew,
  onEdit,
  onDelete,
  onToggleActive,
  onBack,
}) => {
  const [activeTab, setActiveTabState] = useState<LeaveSystemTab>(getInitialSettingsTab);

  const handleSelectTab = (tab: LeaveSystemTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem("hrsystem_leave_settings_active_tab", tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.get("tab")) {
        url.searchParams.set("tab", activeTab);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // ignore
    }
  }, [activeTab]);
  React.useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getInitialSettingsTab());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "daily" | "hourly">("all");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeActionItem, setActiveActionItem] = useState<LeaveTypeSetting | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);
  const [viewRuleType, setViewRuleType] = useState<LeaveTypeSetting | null>(null);

  // Close menus on outside click or scroll
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("#leave-type-action-menu") &&
        !target.closest(".leave-type-settings-btn")
      ) {
        setActiveActionItem(null);
        setMenuCoords(null);
      }
      if (
        !target.closest("#period-dropdown-menu") &&
        !target.closest(".period-dropdown-btn")
      ) {
        setShowPeriodDropdown(false);
      }
      if (
        !target.closest("#status-dropdown-menu") &&
        !target.closest(".status-dropdown-btn")
      ) {
        setShowStatusDropdown(false);
      }
    };

    const handleWindowScroll = () => {
      setActiveActionItem(null);
      setMenuCoords(null);
      setShowPeriodDropdown(false);
      setShowStatusDropdown(false);
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, []);

  // Open Settings action dropdown with viewport safety & upward flipping
  const handleOpenSettingsMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: LeaveTypeSetting
  ) => {
    e.stopPropagation();
    if (activeActionItem?.id === item.id) {
      setActiveActionItem(null);
      setMenuCoords(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 240;
    const openUpward = spaceBelow < menuHeight;
    const menuWidth = 280;
    const left = Math.max(
      12,
      Math.min(window.innerWidth - menuWidth - 16, rect.right - menuWidth)
    );

    setActiveActionItem(item);
    setMenuCoords({
      top: openUpward ? rect.top - 8 : rect.bottom + 8,
      left,
      openUpward,
    });
  };

  // Filter list
  const filteredTypes = useMemo(() => {
    return leaveTypes.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? t.is_active
          : !t.is_active;
      const matchPeriod =
        periodFilter === "all" ? true : t.period_type === periodFilter;
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [leaveTypes, searchQuery, statusFilter, periodFilter]);

  return (
    <div className="w-full space-y-5 font-sans pb-12">
      {/* Page Title & Back Button (Matching Screenshot 1) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-600 dark:text-slate-200 tracking-tight">
          Leave Setting
        </h1>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer shadow-2xs"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      {/* 7 System Tabs — Matching Screenshot 1 Underline Style */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 overflow-x-auto text-xs font-normal">
        <button
          type="button"
          onClick={() => handleSelectTab("leave_type")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "leave_type"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Leave Type
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("entitlement_rule")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "entitlement_rule"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Leave Entitlement Rule
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("blackout_date")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "blackout_date"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Blackout Date Rule
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("compensatory_rule")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "compensatory_rule"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Compensatory Rule
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("leave_hourly")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "leave_hourly"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Leave Hourly Rule
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("approval_flow")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "approval_flow"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Approval Flow
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("settings")}
          className={`pb-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "settings"
              ? "text-slate-800 dark:text-white font-bold border-b-2 border-[#29ABE2] -mb-px"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: LEAVE TYPE (Mockup Main View) */}
      {activeTab === "leave_type" && (
        <div className="space-y-4">
          {/* Controls Bar: Search on Left, Filter & Status on Right */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-[#253C7D] shadow-2xs"
              />
            </div>

            {/* Filter & Status Popovers */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Period Type Filter Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPeriodDropdown(!showPeriodDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className={`period-dropdown-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    periodFilter !== "all"
                      ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                  }`}
                >
                  <i
                    className={`ri-equalizer-line text-xs ${
                      periodFilter !== "all"
                        ? "text-white"
                        : "text-[#253C7D] dark:text-blue-400"
                    }`}
                  />
                  <span>
                    Filter{periodFilter !== "all" ? `: ${periodFilter}` : ""}
                  </span>
                  <i
                    className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                      showPeriodDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showPeriodDropdown && (
                  <div
                    id="period-dropdown-menu"
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-equalizer-line text-xs text-[#253C7D] dark:text-blue-400" />
                        <span>Period Type</span>
                      </span>
                      {periodFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter("all");
                            setShowPeriodDropdown(false);
                          }}
                          className="text-xs text-[#253C7D] hover:underline cursor-pointer font-bold lowercase"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="p-1 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodFilter("all");
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          periodFilter === "all"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>All Period Types</span>
                        {periodFilter === "all" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPeriodFilter("daily");
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          periodFilter === "daily"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>Daily</span>
                        {periodFilter === "daily" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPeriodFilter("hourly");
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          periodFilter === "hourly"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>Hourly</span>
                        {periodFilter === "hourly" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowPeriodDropdown(false);
                  }}
                  className={`status-dropdown-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    statusFilter !== "all"
                      ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                  }`}
                >
                  <i className="ri-shield-check-line text-xs" />
                  <span>
                    Status{statusFilter !== "all" ? `: ${statusFilter}` : ""}
                  </span>
                  <i
                    className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                      showStatusDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showStatusDropdown && (
                  <div
                    id="status-dropdown-menu"
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Status</span>
                      {statusFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("all");
                            setShowStatusDropdown(false);
                          }}
                          className="text-xs text-[#253C7D] hover:underline cursor-pointer font-bold lowercase"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="p-1 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          statusFilter === "all"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>All Status</span>
                        {statusFilter === "all" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("active");
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          statusFilter === "active"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </div>
                        {statusFilter === "active" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("disabled");
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          statusFilter === "disabled"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Disabled</span>
                        </div>
                        {statusFilter === "disabled" && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {canModify && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded text-xs font-bold transition-all shadow-xs cursor-pointer ml-auto sm:ml-0"
                >
                  <i className="ri-add-line text-sm" />
                  <span>Create Leave Type</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Matching Mockup */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-visible">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <i className="ri-loader-4-line animate-spin text-base inline-block mr-1" />
                Loading leave types...
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No leave types found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3.5 text-center w-12">No.</th>
                      <th className="py-2.5 px-3.5">Period Type</th>
                      <th className="py-2.5 px-3.5">Leave Type Code</th>
                      <th className="py-2.5 px-3.5">Leave Type Name</th>
                      <th className="py-2.5 px-3.5 text-center">Total</th>
                      <th className="py-2.5 px-3.5 text-center">Status</th>
                      <th className="py-2.5 px-3.5 text-center w-20">
                        <span className="inline-flex items-center justify-center" title="Settings">
                          <i className="ri-equalizer-line text-sm text-slate-400" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTypes.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* No. */}
                        <td className="py-2.5 px-3.5 text-center text-slate-500 font-semibold">
                          {idx + 1}
                        </td>

                        {/* Period Type */}
                        <td className="py-2.5 px-3.5 capitalize font-medium text-slate-700 dark:text-slate-300">
                          {item.period_type}
                        </td>

                        {/* Leave Type Code */}
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                            {item.code}
                          </span>
                        </td>

                        {/* Leave Type Name with Khmer text */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.name}
                            </span>
                            {item.require_attachment && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0"
                                title="Requires attachment / medical cert"
                              />
                            )}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          1
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {item.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>

                        {/* Settings Action Button */}
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleOpenSettingsMenu(e, item)}
                            className={`leave-type-settings-btn px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer ${
                              activeActionItem?.id === item.id
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#253C7D] hover:text-[#253C7D]"
                            }`}
                            title="Settings"
                          >
                            <i
                              className={`ri-equalizer-line text-sm ${
                                activeActionItem?.id === item.id
                                  ? "text-white dark:text-slate-900"
                                  : "text-[#253C7D] dark:text-blue-400"
                              }`}
                            />
                            <i
                              className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                                activeActionItem?.id === item.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FIXED VIEWPORT ACTION MENU FOR TAB 1 (Immune to table clipping) */}
          {activeActionItem && menuCoords && (
            <div
              id="leave-type-action-menu"
              style={{
                position: "fixed",
                top: menuCoords.openUpward ? "auto" : `${menuCoords.top}px`,
                bottom: menuCoords.openUpward
                  ? `${window.innerHeight - menuCoords.top}px`
                  : "auto",
                left: `${menuCoords.left}px`,
                width: "280px",
              }}
              className="z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 text-left select-none ring-1 ring-black/10 dark:ring-white/10"
            >
              {/* Header indicator */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {activeActionItem.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeActionItem.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {activeActionItem.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Leave Type
                </span>
              </div>

              <div className="p-1 space-y-0.5">
                {/* Action 1: View */}
                <button
                  type="button"
                  onClick={() => {
                    setViewRuleType(activeActionItem);
                    setActiveActionItem(null);
                    setMenuCoords(null);
                  }}
                  className="w-full px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 cursor-pointer font-medium text-xs group transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <i className="ri-eye-line text-sm" />
                  </div>
                  <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                    view this leave entitlement rule
                  </span>
                </button>

                {/* Action 2: Edit */}
                <button
                  type="button"
                  onClick={() => {
                    const item = activeActionItem;
                    setActiveActionItem(null);
                    setMenuCoords(null);
                    onEdit(item);
                  }}
                  className="w-full px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 cursor-pointer font-medium text-xs group transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <i className="ri-edit-line text-sm" />
                  </div>
                  <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                    edit this leave entitlement rule
                  </span>
                </button>

                {/* Action 3: Inactive / Active */}
                <button
                  type="button"
                  onClick={() => {
                    const item = activeActionItem;
                    setActiveActionItem(null);
                    setMenuCoords(null);
                    onToggleActive(item);
                  }}
                  className="w-full px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 cursor-pointer font-medium text-xs group transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      activeActionItem.is_active
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <i
                      className={
                        activeActionItem.is_active
                          ? "ri-toggle-line text-sm"
                          : "ri-toggle-fill text-sm"
                      }
                    />
                  </div>
                  <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                    {activeActionItem.is_active ? "inactive" : "active"} this leave entitlement rule
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Action 4: Delete */}
                <button
                  type="button"
                  onClick={() => {
                    const item = activeActionItem;
                    setActiveActionItem(null);
                    setMenuCoords(null);
                    onDelete(item.id, item.name);
                  }}
                  className="w-full px-2.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 cursor-pointer font-medium text-xs group transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <i className="ri-delete-bin-line text-sm" />
                  </div>
                  <span className="whitespace-nowrap font-semibold text-rose-600 dark:text-rose-400">
                    delete this leave entitlement rule
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* AL System Section — Exactly Matching the Mockup's 3 Rule Boxes */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                AL System
              </span>
              <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              {/* Box 1: Core AL Rules */}
              <div className="md:col-span-4 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs">
                <div className="font-bold text-[#253C7D] dark:text-blue-300 flex items-center gap-1.5">
                  <i className="ri-shield-check-line text-sm" />
                  <span>Annual Leave Policies</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span><strong>prorate</strong>: based on joining and exit dates.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span><strong>not allow for these contract types</strong> (Probation, Internship...)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      when update <strong>pass probation</strong> staff have AL balance from start month to current month estimate <strong>4.5 days</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span><strong>not allowance negative balance</strong></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span><strong>use monthly balance</strong> accumulation</span>
                  </li>
                </ul>
              </div>

              {/* Box 2: Prorate Calculation & Join/Exit Examples */}
              <div className="md:col-span-5 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs">
                <div className="font-bold text-[#253C7D] dark:text-blue-300 flex items-center gap-1.5">
                  <i className="ri-calculator-line text-sm" />
                  <span>Prorate Calculation & Examples</span>
                </div>
                <div className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>Prorate calculate AL</strong>: provide to staff new join will provide <strong>4.5 days</strong> in that of pass probation, but prorate date after pass probation to end of month.
                  </p>
                  <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 font-mono text-[11px] space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      <strong>Example</strong>: join 15th-Oct-2026:
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      • 15th-Oct-2026 to 14th-Jan-2027: gets <strong>4.5 days</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      • 15th-Jan-2027 to 31st-Jan-2027 prorate: AL gets <strong>1 day</strong>
                    </p>
                  </div>
                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200/80">
                    <strong>Exit</strong>: AL prorate too — if last day on 15th, they get only <strong>1 day</strong> of AL.
                  </p>
                </div>
              </div>

              {/* Box 3: Formula of Prorate AL */}
              <div className="md:col-span-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs">
                <div className="font-bold text-[#253C7D] dark:text-blue-300 flex items-center gap-1.5">
                  <i className="ri-function-line text-sm" />
                  <span>Formula of Prorate AL</span>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                      <span>• from 1st – 14th:</span>
                      <span className="font-bold text-emerald-600">1.5 days</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                      <span>• from 15th – 20th:</span>
                      <span className="font-bold text-blue-600">1.0 day</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                      <span>• from 21st – 31st:</span>
                      <span className="font-bold text-slate-400">0 days</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-sans text-slate-500 dark:text-slate-400">
                    Accumulation standard: 18 days/year (1.5 days per qualifying active month).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE ENTITLEMENT RULE */}
      {activeTab === "entitlement_rule" && (
        <div className="space-y-6">
          <LeaveEntitlementRulesTabContent
            canModify={canModify}
            employees={employees}
            availableLeaveCodes={availableLeaveCodes}
          />

          {/* Statutory Allowances Guidelines Reference */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="ri-scales-3-line text-[#253C7D] text-lg" />
              <span>Leave Entitlement Rules & Statutory Allowances</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on the Kingdom of Cambodia Labour Law (Articles 166, 171, 182) and Company Internal HR Regulations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Annual Leave Accrual & Seniority (Art. 166)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Standard entitlement is <strong>18 working days/year</strong>. An additional <strong>+1 day</strong> is awarded for every <strong>3 years of continuous service</strong> with the company.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Special Statutory Leave (Art. 171)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Employees are entitled to up to <strong>7 days</strong> for special family events (marriage of employee, childbirth by spouse, marriage of children, bereavement of spouse/children/parents). Supporting documentation required.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Maternity Leave (Art. 182)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Female staff with at least 1 year continuous service are granted <strong>90 continuous days</strong> of maternity leave at 50% statutory wage.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Sick Leave & Hospitalization</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Up to <strong>30 calendar days</strong> with official medical certificate. Prolonged sick leave beyond 30 days requires hospital admission proof and Division Director approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLACKOUT DATE RULE */}
      {activeTab === "blackout_date" && (
        <div className="space-y-6 font-sans">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
              BLACKOUT DATE RULE INFO
            </h2>

            {canModify && (
              <button
                type="button"
                onClick={() => alert("Add Blackout Date Rule feature")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#29ABE2] text-[#29ABE2] hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <i className="ri-add-circle-line text-sm" />
                <span>Add Blackout Date Rule</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                Company Operational Blackout Periods
              </span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 font-semibold">No.</th>
                    <th className="py-2.5 px-3 font-semibold">Rule Name</th>
                    <th className="py-2.5 px-3 font-semibold">Date Range</th>
                    <th className="py-2.5 px-3 font-semibold">Restricted Leave Types</th>
                    <th className="py-2.5 px-3 font-semibold">Applies To</th>
                    <th className="py-2.5 px-3 font-semibold">Exception Authority</th>
                    <th className="py-2.5 px-3 text-center font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No records found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPENSATORY RULE */}
      {activeTab === "compensatory_rule" && (
        <div className="space-y-6 font-sans">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
              COMPENSATORY RULE INFO
            </h2>

            {canModify && (
              <button
                type="button"
                onClick={() => alert("Add Compensatory Rule feature")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#29ABE2] text-[#29ABE2] hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <i className="ri-add-circle-line text-sm" />
                <span>Add Compensatory Rule</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                Compensatory Time-Off (Comp Leave) Conversion Rules
              </span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 font-semibold">No.</th>
                    <th className="py-2.5 px-3 font-semibold">Rule Name</th>
                    <th className="py-2.5 px-3 font-semibold">Source Event</th>
                    <th className="py-2.5 px-3 font-semibold">Credit Ratio</th>
                    <th className="py-2.5 px-3 font-semibold">Validity Period</th>
                    <th className="py-2.5 px-3 font-semibold">Max Cap</th>
                    <th className="py-2.5 px-3 text-center font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No records found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEAVE HOURLY RULE */}
      {activeTab === "leave_hourly" && (
        <div className="space-y-6 font-sans">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
              LEAVE HOURLY RULE INFO
            </h2>

            {canModify && (
              <button
                type="button"
                onClick={() => alert("Add Leave Hourly Rule feature")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#29ABE2] text-[#29ABE2] hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <i className="ri-add-circle-line text-sm" />
                <span>Add Leave Hourly Rule</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                Short-Term Hourly Leave Configurations
              </span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 font-semibold">No.</th>
                    <th className="py-2.5 px-3 font-semibold">Rule Name</th>
                    <th className="py-2.5 px-3 font-semibold">Min Slot</th>
                    <th className="py-2.5 px-3 font-semibold">Max Daily Limit</th>
                    <th className="py-2.5 px-3 font-semibold">Deduction Method</th>
                    <th className="py-2.5 px-3 font-semibold">Advance Request</th>
                    <th className="py-2.5 px-3 text-center font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No records found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: APPROVAL FLOW (Exact Match to Screenshot 1, 2, 3) */}
      {activeTab === "approval_flow" && (
        <LeaveApprovalFlowTabContent
          canModify={canModify}
          employees={employees}
        />
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="ri-settings-4-line text-[#253C7D] text-lg" />
              <span>General System Configurations</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Allow Negative Leave Balance</h3>
                  <p className="text-slate-500">Permit employees to submit requests that exceed their current available balance.</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                  Disabled (Strict Zero-Floor)
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Annual Leave Carry-Forward Limit</h3>
                  <p className="text-slate-500">Maximum unused days that can roll over into the first quarter of next year.</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#253C7D] font-bold text-[11px]">
                  Max 6 Days (Valid till 31-Mar)
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Probation Restriction</h3>
                  <p className="text-slate-500">Lock Annual Leave application until probation evaluation is passed.</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                  Active (Auto-accrue 4.5d after pass)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Rule Modal */}
      {viewRuleType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#253C7D] text-white font-mono font-bold text-xs">
                  {viewRuleType.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Leave Entitlement Rule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewRuleType(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-slate-400">Leave Type Name:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {viewRuleType.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10.5px] text-slate-400 font-medium">Period Type</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                    {viewRuleType.period_type}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10.5px] text-slate-400 font-medium">Rate Multiplier</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {viewRuleType.rate}x
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender Eligibility:</span>
                  <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                    {viewRuleType.eligible_for === "both" ? "All Genders" : `${viewRuleType.eligible_for} Only`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Medical Attachment Required:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRuleType.require_attachment ? "Yes (Mandatory)" : "Optional"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Advance Notice Required:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRuleType.request_in_advance ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Restricted Contracts:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRuleType.excluded_contract_types?.length
                      ? viewRuleType.excluded_contract_types.join(", ")
                      : "None (All Allowed)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRuleType(null)}
                className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
