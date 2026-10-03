import React, { useState, useRef, useEffect } from "react";

export type SiteFilterStatus = "all" | "active" | "disabled";

interface SiteStatusFilterProps {
  status: SiteFilterStatus;
  onChange: (status: SiteFilterStatus) => void;
}

export function SiteStatusFilter({ status, onChange }: SiteStatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const options: { label: string; value: SiteFilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Disabled", value: "disabled" },
  ];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Pill Button matching screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded-full shadow-2xs cursor-pointer transition-colors"
      >
        <span>Status</span>
        <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover matching screenshot with checkmark */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors ${
                  isSelected ? "text-slate-800 dark:text-slate-100 font-medium" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <div className="w-4 flex items-center justify-center">
                  {isSelected && <i className="ri-check-line text-sm text-slate-700 dark:text-slate-200 font-bold" />}
                </div>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
