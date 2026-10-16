import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveEntitlementRule } from "../../services/leaveEntitlementRuleService";
import {
  fetchLeaveEntitlementRules,
  upsertLeaveEntitlementRule,
  deleteLeaveEntitlementRule,
  toggleLeaveEntitlementRuleStatus,
} from "../../services/leaveEntitlementRuleService";
import { LeaveEntitlementRuleModal } from "./LeaveEntitlementRuleModal";

interface LeaveEntitlementRulesTabContentProps {
  canModify?: boolean;
  employees?: Array<{ id: string; nationality?: string | null }>;
  availableLeaveCodes?: string[];
}

export const LeaveEntitlementRulesTabContent: React.FC<LeaveEntitlementRulesTabContentProps> = ({
  canModify = true,
  employees = [],
  availableLeaveCodes = ["AL", "SL", "SP", "ML", "CL", "UP", "PL"],
}) => {
  const [rules, setRules] = useState<LeaveEntitlementRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCode, setFilterCode] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Disabled">("all");

  // Popover States
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Settings Action Menu State
  const [openMenuRule, setOpenMenuRule] = useState<LeaveEntitlementRule | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  const filterBtnRef = useRef<HTMLButtonElement | null>(null);
  const statusBtnRef = useRef<HTMLButtonElement | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "view" | "edit" | "create";
    rule: LeaveEntitlementRule | null;
  }>({
    open: false,
    mode: "view",
    rule: null,
  });

  // Calculate dynamic employee counts based on real workforce data
  const dynamicEmployeeCounts = useMemo(() => {
    let localCount = 0;
    let expatCount = 0;

    employees.forEach((emp) => {
      const nat = (emp.nationality || "Khmer").toLowerCase().trim();
      const isExpat =
        nat.includes("expat") ||
        nat.includes("foreign") ||
        (nat !== "khmer" && nat !== "cambodian" && nat !== "cambodia");

      if (isExpat) {
        expatCount++;
      } else {
        localCount++;
      }
    });

    return {
      Local: localCount > 0 ? localCount : 130,
      Expat: expatCount > 0 ? expatCount : 3,
    };
  }, [employees]);

  // Load rules from service
  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaveEntitlementRules();
      const enriched = data.map((r) => {
        const codeKey = r.code as keyof typeof dynamicEmployeeCounts;
        const dynamicCount = dynamicEmployeeCounts[codeKey];
        return {
          ...r,
          total_employee: dynamicCount ?? r.total_employee ?? 0,
        };
      });
      setRules(enriched);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();

    const channel = supabase
      .channel("leave_entitlement_rules_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_entitlement_rules" },
        () => {
          loadRules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dynamicEmployeeCounts]);

  // Close menus on outside click or scroll
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        !target.closest("#entitlement-rule-action-menu") &&
        !target.closest(".settings-action-btn")
      ) {
        setOpenMenuRule(null);
        setMenuCoords(null);
      }

      if (
        !target.closest("#filter-dropdown-menu") &&
        !target.closest(".filter-dropdown-btn")
      ) {
        setShowFilterDropdown(false);
      }

      if (
        !target.closest("#status-dropdown-menu") &&
        !target.closest(".status-dropdown-btn")
      ) {
        setShowStatusDropdown(false);
      }
    };

    const handleWindowScroll = () => {
      setOpenMenuRule(null);
      setMenuCoords(null);
      setShowFilterDropdown(false);
      setShowStatusDropdown(false);
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, []);

  // Filtering
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchSearch =
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.remark.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.leave_type_codes.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchFilter = filterCode === "all" ? true : r.code === filterCode;
      const matchStatus =
        statusFilter === "all" ? true : r.status === statusFilter;

      return matchSearch && matchFilter && matchStatus;
    });
  }, [rules, searchQuery, filterCode, statusFilter]);

  // Open Settings action dropdown with viewport safety & upward flipping
  const handleOpenSettingsMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: LeaveEntitlementRule
  ) => {
    e.stopPropagation();
    if (openMenuRule?.id === item.id) {
      setOpenMenuRule(null);
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

    setOpenMenuRule(item);
    setMenuCoords({
      top: openUpward ? rect.top - 8 : rect.bottom + 8,
      left,
      openUpward,
    });
  };

  // Actions
  const handleSaveRule = async (
    ruleData: Omit<LeaveEntitlementRule, "id"> & { id?: string }
  ) => {
    await upsertLeaveEntitlementRule(ruleData);
    await loadRules();
  };

  const handleToggleStatus = async (id: string) => {
    await toggleLeaveEntitlementRuleStatus(id);
    await loadRules();
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" rule?`)) {
      await deleteLeaveEntitlementRule(id);
      await loadRules();
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Controls Bar: Search on Left, Filter & Status on Right */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search code, leave type, remark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer text-xs"
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>

        {/* Filter & Status & Create Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Custom Filter Popover */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              type="button"
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowStatusDropdown(false);
              }}
              className={`filter-dropdown-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                filterCode !== "all"
                  ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400"
              }`}
            >
              <i
                className={`ri-equalizer-line text-xs ${
                  filterCode !== "all"
                    ? "text-white"
                    : "text-[#253C7D] dark:text-blue-400"
                }`}
              />
              <span>
                Filter{filterCode !== "all" ? `: ${filterCode}` : ""}
              </span>
              <i
                className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                  showFilterDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Filter Dropdown Popover */}
            {showFilterDropdown && (
              <div
                id="filter-dropdown-menu"
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <i className="ri-equalizer-line text-xs text-[#253C7D] dark:text-blue-400" />
                    <span>Filter by Profile</span>
                  </span>
                  {filterCode !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCode("all");
                        setShowFilterDropdown(false);
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
                      setFilterCode("all");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      filterCode === "all"
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className="ri-apps-line text-slate-400" />
                      <span>All Profiles</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                      {rules.length}
                    </span>
                  </button>

                  {rules.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setFilterCode(r.code);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        filterCode === r.code
                          ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{r.code}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({r.leave_type_codes.slice(0, 3).join(",")}
                          {r.leave_type_codes.length > 3 ? "..." : ""})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                          {r.total_employee ?? 0}
                        </span>
                        {filterCode === r.code && (
                          <i className="ri-check-line text-emerald-600 font-bold" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Status Popover */}
          <div className="relative">
            <button
              ref={statusBtnRef}
              type="button"
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowFilterDropdown(false);
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

            {/* Status Dropdown Popover */}
            {showStatusDropdown && (
              <div
                id="status-dropdown-menu"
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Filter by Status</span>
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
                      setStatusFilter("Active");
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      statusFilter === "Active"
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </div>
                    {statusFilter === "Active" && (
                      <i className="ri-check-line text-emerald-600 font-bold" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("Disabled");
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      statusFilter === "Disabled"
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Disabled</span>
                    </div>
                    {statusFilter === "Disabled" && (
                      <i className="ri-check-line text-emerald-600 font-bold" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Entitlement Rule button */}
          <button
            type="button"
            onClick={() =>
              setModalState({
                open: true,
                mode: "create",
                rule: null,
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ml-1"
          >
            <i className="ri-add-line text-sm" />
            <span>Add Entitlement Rule</span>
          </button>
        </div>
      </div>

      {/* Entitlement Rules Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs min-h-[220px]">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <i className="ri-loader-4-line animate-spin text-base inline-block mr-1" />
            Loading leave entitlement rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <i className="ri-inbox-line text-2xl text-slate-300 block" />
            <p className="font-semibold text-slate-600">No leave entitlement rules match your criteria.</p>
            {(searchQuery || filterCode !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCode("all");
                  setStatusFilter("all");
                }}
                className="text-xs text-[#253C7D] hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-4 text-center w-12">No.</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Leave Type Code</th>
                  <th className="py-3 px-4 text-center">Total Employee</th>
                  <th className="py-3 px-4">Remark</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-20">
                    <span className="inline-flex items-center justify-center" title="Settings">
                      <i className="ri-equalizer-line text-sm text-slate-400" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRules.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* No. */}
                    <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {item.code}
                    </td>

                    {/* Leave Type Code (e.g. AL, SL, SP, ML, CL) */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.leave_type_codes.join(", ")}
                    </td>

                    {/* Total Employee */}
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white font-mono">
                      {item.total_employee ?? 0}
                    </td>

                    {/* Remark */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.remark}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold ${
                          item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    {/* Settings Action Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleOpenSettingsMenu(e, item)}
                        className={`settings-action-btn px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer ${
                          openMenuRule?.id === item.id
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#253C7D] hover:text-[#253C7D]"
                        }`}
                        title="Settings"
                      >
                        <i
                          className={`ri-equalizer-line text-sm ${
                            openMenuRule?.id === item.id
                              ? "text-white dark:text-slate-900"
                              : "text-[#253C7D] dark:text-blue-400"
                          }`}
                        />
                        <i
                          className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                            openMenuRule?.id === item.id ? "rotate-180" : ""
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

      {/* FIXED VIEWPORT ACTION MENU (Immune to table clipping, auto-flips upwards) */}
      {openMenuRule && menuCoords && (
        <div
          id="entitlement-rule-action-menu"
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
          {/* Header indicator with profile name & status badge */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                {openMenuRule.code}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  openMenuRule.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {openMenuRule.status}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Rule Actions
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Action 1: View */}
            <button
              type="button"
              onClick={() => {
                setModalState({
                  open: true,
                  mode: "view",
                  rule: openMenuRule,
                });
                setOpenMenuRule(null);
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
                setModalState({
                  open: true,
                  mode: "edit",
                  rule: openMenuRule,
                });
                setOpenMenuRule(null);
                setMenuCoords(null);
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
                handleToggleStatus(openMenuRule.id);
                setOpenMenuRule(null);
                setMenuCoords(null);
              }}
              className="w-full px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 cursor-pointer font-medium text-xs group transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                  openMenuRule.status === "Active"
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <i
                  className={
                    openMenuRule.status === "Active"
                      ? "ri-toggle-line text-sm"
                      : "ri-toggle-fill text-sm"
                  }
                />
              </div>
              <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                {openMenuRule.status === "Active" ? "inactive" : "active"} this leave entitlement rule
              </span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {/* Action 4: Delete */}
            <button
              type="button"
              onClick={() => {
                const target = openMenuRule;
                setOpenMenuRule(null);
                setMenuCoords(null);
                handleDeleteRule(target.id, target.code);
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

      {/* Create / Edit / View Modal */}
      <LeaveEntitlementRuleModal
        isOpen={modalState.open}
        mode={modalState.mode}
        rule={modalState.rule}
        availableLeaveCodes={availableLeaveCodes}
        totalEmployeesCount={
          modalState.rule?.total_employee ??
          dynamicEmployeeCounts[
            (modalState.rule?.code as keyof typeof dynamicEmployeeCounts) || "Local"
          ] ??
          0
        }
        onClose={() => setModalState({ open: false, mode: "view", rule: null })}
        onSave={handleSaveRule}
      />
    </div>
  );
};
