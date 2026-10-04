import { useRef, useEffect } from "react";
import { TabItem, BranchTabType, STRUCTURE_TABS } from "./types";

interface BranchMobileTabsDropdownProps {
  activeTab: BranchTabType;
  setActiveTab: (tab: BranchTabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  allTabs: TabItem[];
  currentTab: TabItem;
}

export function BranchMobileTabsDropdown({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  allTabs,
  currentTab,
}: BranchMobileTabsDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const handleSelect = (id: BranchTabType) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden pb-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer select-none ${
          isOpen
            ? "border-[#0088cc] ring-2 ring-[#0088cc]/15 shadow-sm"
            : "border-slate-200 hover:border-slate-300"
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center shrink-0">
            <i className={`${currentTab?.icon || "ri-list-check"} text-sm`} />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-bold text-slate-900 truncate">
              {currentTab?.label}
            </span>
            {currentTab?.count !== undefined && currentTab?.count !== null && (
              <span className="text-[11px] font-semibold text-slate-500">
                ({currentTab.count})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] font-medium text-slate-400">
            {allTabs.findIndex((t) => t.id === activeTab) + 1} / {allTabs.length}
          </span>
          <i
            className={`ri-arrow-down-s-line text-slate-400 text-base transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#0088cc]" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-98 duration-150">
          <div className="space-y-0.5 pb-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Overview & Operations
            </div>
            {allTabs
              .filter((t) => t.group === "core")
              .map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelect(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? "bg-[#0088cc]/10 text-[#0088cc] font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i className={`${tab.icon} text-sm ${isActive ? "text-[#0088cc]" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                      {tab.count !== undefined && tab.count !== null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {tab.count}
                        </span>
                      )}
                    </div>
                    {isActive && <i className="ri-check-line text-sm text-[#0088cc] font-bold shrink-0 ml-2" />}
                  </button>
                );
              })}
          </div>

          <div className="space-y-0.5 pt-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Organizational Master Data
            </div>
            {STRUCTURE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-[#0088cc]/10 text-[#0088cc] font-bold"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <i className={`${tab.icon} text-sm ${isActive ? "text-[#0088cc]" : "text-slate-400"}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {isActive && <i className="ri-check-line text-sm text-[#0088cc] font-bold shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
