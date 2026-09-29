import { useState, useRef, useEffect } from "react";

interface EmployeeTypeStatusFilterProps {
  statusFilter: "all" | "active" | "disabled";
  setStatusFilter: (status: "all" | "active" | "disabled") => void;
}

export function EmployeeTypeStatusFilter({
  statusFilter,
  setStatusFilter,
}: EmployeeTypeStatusFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const labelMap = {
    all: "Status",
    active: "Active",
    disabled: "Disabled",
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#2b8de3] text-slate-700 dark:text-slate-200 text-xs rounded-full shadow-2xs cursor-pointer transition-colors"
      >
        <span>{labelMap[statusFilter]}</span>
        <i className="ri-arrow-down-s-line text-xs text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
              statusFilter === "all" ? "text-[#2b8de3] font-semibold" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            All Status
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("active");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
              statusFilter === "active" ? "text-[#2b8de3] font-semibold" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("disabled");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
              statusFilter === "disabled" ? "text-[#2b8de3] font-semibold" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            Disabled
          </button>
        </div>
      )}
    </div>
  );
}
