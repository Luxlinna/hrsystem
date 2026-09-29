import { useState, useRef, useEffect } from "react";
import { DEFAULT_TAX_POSITIONS } from "../../hooks/usePositions";

interface PositionTaxFilterProps {
  taxFilter: string;
  setTaxFilter: (val: string) => void;
}

export function PositionTaxFilter({
  taxFilter,
  setTaxFilter,
}: PositionTaxFilterProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#2b8de3] text-[#2b8de3] hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-medium rounded-full shadow-2xs cursor-pointer transition-colors"
      >
        <span>Tax Position</span>
        <i className="ri-arrow-down-s-line text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              setTaxFilter("all");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer"
          >
            <span>All Tax Positions</span>
            {taxFilter === "all" && <i className="ri-check-line text-sm text-[#2b8de3]" />}
          </button>

          {DEFAULT_TAX_POSITIONS.map((tp) => {
            const isSelected = taxFilter === tp;
            return (
              <button
                key={tp}
                type="button"
                onClick={() => {
                  setTaxFilter(tp);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer"
              >
                <span>{tp}</span>
                {isSelected && <i className="ri-check-line text-sm text-[#2b8de3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
