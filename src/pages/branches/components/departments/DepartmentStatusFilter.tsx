import { useState, useRef, useEffect } from "react";

interface DepartmentStatusFilterProps {
  statusFilter: "all" | "active" | "disabled";
  setStatusFilter: (status: "all" | "active" | "disabled") => void;
}

export function DepartmentStatusFilter({
  statusFilter,
  setStatusFilter,
}: DepartmentStatusFilterProps) {
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

  const options: Array<{ label: string; value: "all" | "active" | "disabled" }> = [
    { label: "All Status", value: "all" },
    { label: "Active", value: "active" },
    { label: "Disabled", value: "disabled" },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-[#2b8de3] text-[#2b8de3] hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-medium rounded-full shadow-2xs cursor-pointer transition-colors"
      >
        <span>Status</span>
        <i className="ri-arrow-down-s-line text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-between cursor-pointer"
              >
                <span>{opt.label}</span>
                {isSelected && <i className="ri-check-line text-sm text-[#2b8de3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
