import { useState, useRef, useEffect } from "react";
import { SELF_SERVICE_TABS } from "../constants";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNav({ activeTab, onTabChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTab = SELF_SERVICE_TABS.find((t) => t.id === activeTab) || SELF_SERVICE_TABS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
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
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    setIsOpen(false);
  };

  return (
    <div className="mb-4 sm:mb-5">
      {/* Mobile Selector */}
      <div className="sm:hidden relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl shadow-2xs transition-all cursor-pointer select-none ${
            isOpen ? "border-[#253C7D] ring-2 ring-[#253C7D]/15" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
              <i className={`${currentTab.icon} text-sm`} />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentTab.label}</span>
          </div>
          <i className={`ri-arrow-down-s-line text-slate-400 text-base transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 p-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-98 duration-150">
            <div className="space-y-0.5">
              {SELF_SERVICE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelect(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isActive ? "bg-[#253C7D]/10 text-[#253C7D] font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i className={`${tab.icon} text-sm ${isActive ? "text-[#253C7D]" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {isActive && <i className="ri-check-line text-sm text-[#253C7D] font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Horizontal Tabs */}
      <div className="hidden sm:flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-[13px] no-scrollbar">
        {SELF_SERVICE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCheckInTab = tab.id === "checkin";
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`pb-2.5 px-3.5 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 outline-none select-none ${
                isActive
                  ? "border-[#253C7D] dark:border-[#29ABE2] text-[#253C7D] dark:text-[#29ABE2]"
                  : isCheckInTab
                  ? "border-transparent text-[#253C7D] dark:text-[#29ABE2] hover:text-[#1E3066] font-bold"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <i className={`${tab.icon} ${isCheckInTab ? "text-[#253C7D] dark:text-[#29ABE2]" : ""}`} />
              <span>{tab.label}</span>
              {isCheckInTab && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
