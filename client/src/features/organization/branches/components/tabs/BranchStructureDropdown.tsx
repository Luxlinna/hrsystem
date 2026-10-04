import { useState, useRef, useEffect } from "react";
import { BranchTabType, STRUCTURE_TABS } from "./types";

interface BranchStructureDropdownProps {
  activeTab: BranchTabType;
  setActiveTab: (tab: BranchTabType) => void;
}

export function BranchStructureDropdown({
  activeTab,
  setActiveTab,
}: BranchStructureDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isStructureActive = STRUCTURE_TABS.some((tab) => tab.id === activeTab);
  const activeStructureItem = STRUCTURE_TABS.find((tab) => tab.id === activeTab);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
  }, [isOpen]);

  const handleSelect = (id: BranchTabType) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`pb-2.5 sm:pb-3 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
          isStructureActive
            ? "border-[#0088cc] text-[#0088cc]"
            : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <i
          className={`${
            isStructureActive && activeStructureItem
              ? activeStructureItem.icon
              : "ri-node-tree"
          } text-sm sm:text-base`}
        />
        <span>
          {isStructureActive && activeStructureItem
            ? activeStructureItem.label
            : "Org Structure"}
        </span>

        {isStructureActive && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0088cc]/10 text-[#0088cc]">
            Sub-tab
          </span>
        )}

        <i
          className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isStructureActive ? "text-[#0088cc]" : "text-slate-400"}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200/95 rounded-xl shadow-xl z-50 p-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-98 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            Organizational Master Data
          </div>
          <div className="space-y-0.5 pt-1">
            {STRUCTURE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                    isActive ? "bg-[#0088cc]/10 text-[#0088cc]" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isActive
                        ? "bg-[#0088cc] text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                    }`}
                  >
                    <i className={`${tab.icon} text-sm`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isActive ? "text-[#0088cc]" : "text-slate-800"}`}>
                        {tab.label}
                      </span>
                      {isActive && <i className="ri-check-line text-sm text-[#0088cc] font-bold shrink-0 ml-1.5" />}
                    </div>
                    {tab.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                        {tab.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
