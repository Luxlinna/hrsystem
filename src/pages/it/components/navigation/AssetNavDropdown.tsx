import React, { useState, useRef, useEffect } from "react";
import type { ITTabType } from "../../types";

interface AssetNavDropdownProps {
  currentTab: ITTabType;
  onSelectTab: (tab: ITTabType) => void;
  className?: string;
}

interface NavItem {
  key: ITTabType;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "categories", label: "Category", icon: "ri-settings-4-line" },
  { key: "assets", label: "Asset Inventory", icon: "ri-box-3-line" },
  { key: "assignments", label: "Assignment and Return", icon: "ri-loop-left-line" },
  { key: "history", label: "History", icon: "ri-calendar-line" },
];

export const AssetNavDropdown: React.FC<AssetNavDropdownProps> = ({
  currentTab,
  onSelectTab,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={containerRef}>
      {/* Trigger matching screenshot style */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#253C7D] transition-colors py-1 cursor-pointer group focus:outline-none focus-visible:outline-none"
      >
        <span>Asset</span>
        <i
          className={`ri-arrow-down-s-line text-xs text-slate-400 group-hover:text-[#253C7D] transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#253C7D]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown matching Screenshot */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-md shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentTab === item.key ||
              (item.key === "assets" && currentTab === "settings");

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectTab(item.key);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#253C7D]/10 text-[#253C7D] font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <i className={`${item.icon} text-sm ${isActive ? "text-[#253C7D]" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
