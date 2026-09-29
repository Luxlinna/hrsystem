import { useState, useRef, useEffect } from "react";
import { SELF_SERVICE_TABS } from "../constants";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNav({ activeTab, onTabChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTab =
    SELF_SERVICE_TABS.find((t) => t.id === activeTab) || SELF_SERVICE_TABS[0];

  // Close dropdown on outside click or Escape key
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
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    setIsOpen(false);
  };

  return (
    <div className="mb-4 sm:mb-5">
      {/* Mobile: Sleek Custom Dropdown Selector */}
      <div className="sm:hidden relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl shadow-2xs transition-all cursor-pointer select-none ${
            isOpen
              ? "border-[#253C7D] ring-2 ring-[#253C7D]/15 shadow-sm"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
              <i className={`${currentTab.icon} text-sm`} />
            </div>
            <span className="text-xs font-bold text-slate-900 truncate">
              {currentTab.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10.5px] font-medium text-slate-400">
              {SELF_SERVICE_TABS.findIndex((t) => t.id === activeTab) + 1} / {SELF_SERVICE_TABS.length}
            </span>
            <i
              className={`ri-arrow-down-s-line text-slate-400 text-base transition-transform duration-200 ${
                isOpen ? "rotate-180 text-[#253C7D]" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl z-40 p-1 divide-y divide-slate-100 overflow-hidden animate-in fade-in zoom-in-98 duration-150"
          >
            <div className="space-y-0.5">
              {SELF_SERVICE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => handleSelect(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? "bg-[#253C7D]/10 text-[#253C7D] font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i
                        className={`${tab.icon} text-sm ${
                          isActive ? "text-[#253C7D]" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {isActive && (
                      <i className="ri-check-line text-sm text-[#253C7D] font-bold shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Clean Horizontal Tabs */}
      <div className="hidden sm:flex items-center gap-1.5 border-b border-slate-200/80 overflow-x-auto text-[13px] no-scrollbar">
        {SELF_SERVICE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 outline-none focus:outline-none focus:ring-0 select-none ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <i className={`${tab.icon} text-sm`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
