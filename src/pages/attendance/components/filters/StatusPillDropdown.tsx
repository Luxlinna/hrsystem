import { memo, useState, useRef, useEffect } from "react";
import { STATUS_CONFIG } from "../../constants";

interface Props {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const StatusPillDropdown = memo(function StatusPillDropdown({
  filterStatus,
  setFilterStatus,
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const currentLabel =
    filterStatus === "all"
      ? "Status"
      : STATUS_CONFIG[filterStatus]?.label || filterStatus;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none ${
          filterStatus !== "all"
            ? "border border-sky-500 bg-sky-50/70 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700"
            : "border border-sky-400 dark:border-sky-500/70 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 hover:bg-sky-50/40"
        }`}
        aria-expanded={open}
      >
        <span className="capitalize">{currentLabel}</span>
        <i
          className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-98 duration-100">
          <button
            type="button"
            onClick={() => {
              setFilterStatus("all");
              setOpen(false);
              onOpenChange?.(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors ${
              filterStatus === "all"
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>All Statuses</span>
            {filterStatus === "all" && <i className="ri-check-line font-bold" />}
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />

          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const isSelected = filterStatus === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setFilterStatus(k);
                  setOpen(false);
                  onOpenChange?.(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <i className={`${v.icon} text-xs text-slate-400`} />
                  <span>{v.label}</span>
                </div>
                {isSelected && <i className="ri-check-line font-bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
