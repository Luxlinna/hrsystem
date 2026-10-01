import { useState } from "react";
import { BranchTabType, TabItem, STRUCTURE_TABS } from "./tabs/types";
import { BranchMobileTabsDropdown } from "./tabs/BranchMobileTabsDropdown";
import { BranchStructureDropdown } from "./tabs/BranchStructureDropdown";

export type { BranchTabType };

interface BranchTabsNavProps {
  activeTab: BranchTabType;
  setActiveTab: (tab: BranchTabType) => void;
  isSuperAdmin: boolean;
  totalBranches: number;
  employeeCount: number;
}

export function BranchTabsNav({
  activeTab,
  setActiveTab,
  isSuperAdmin,
  totalBranches,
  employeeCount,
}: BranchTabsNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTabs: TabItem[] = [
    ...(isSuperAdmin
      ? [
          {
            id: "all" as BranchTabType,
            label: "All Units",
            icon: "ri-layout-grid-line",
            count: totalBranches,
            group: "core" as const,
          },
        ]
      : []),
    {
      id: "profile" as BranchTabType,
      label: "Company Profile",
      icon: "ri-building-line",
      group: "core" as const,
    },
    {
      id: "sites" as BranchTabType,
      label: "Sites",
      icon: "ri-map-pin-2-line",
      group: "core" as const,
    },
    ...STRUCTURE_TABS,
  ];

  const currentTab = allTabs.find((t) => t.id === activeTab) || allTabs[0];

  return (
    <div className="relative border-b border-slate-200">
      {/* 1. Mobile Custom Dropdown */}
      <BranchMobileTabsDropdown
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        allTabs={allTabs}
        currentTab={currentTab}
      />

      {/* 2. Desktop Modern Tab Strip with Dropdown Tab */}
      <div className="hidden md:flex items-center gap-1 sm:gap-2 -mb-px overflow-visible text-[13px] sm:text-[13.5px]">
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`pb-2.5 sm:pb-3 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "all"
                ? "border-[#0088cc] text-[#0088cc]"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <i className="ri-layout-grid-line text-sm sm:text-base" />
            <span>All Units</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "all" ? "bg-[#0088cc]/15 text-[#0088cc]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalBranches}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`pb-2.5 sm:pb-3 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "profile"
              ? "border-[#0088cc] text-[#0088cc]"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <i className="ri-building-line text-sm sm:text-base" />
          <span>Company Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sites")}
          className={`pb-2.5 sm:pb-3 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "sites"
              ? "border-[#0088cc] text-[#0088cc]"
              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <i className="ri-map-pin-2-line text-sm sm:text-base" />
          <span>Sites</span>
        </button>

        {/* Dropdown Menu for Structure & Master Data */}
        <BranchStructureDropdown
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
