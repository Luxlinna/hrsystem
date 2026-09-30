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
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const isSelected = filterStatus !== "all" && Boolean(filterStatus);
  const currentLabel =
    !isSelected
      ? "Status"
      : STATUS_CONFIG[filterStatus]?.label || filterStatus;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none ${
          open || isSelected
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white dark:bg-slate-800 hover:bg-[#253C7D]/5"
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
        <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setFilterStatus("all");
              setOpen(false);
              onOpenChange?.(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
              !isSelected
                ? "bg-[#253C7D] text-white font-medium"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>All Statuses</span>
            {!isSelected && <i className="ri-check-line font-bold" />}
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />

          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const isCurrent = filterStatus === k;
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
                  isCurrent
                    ? "bg-[#253C7D] text-white font-medium"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <i className={`${v.icon} text-xs ${isCurrent ? "text-white" : "text-slate-400"}`} />
                  <span>{v.label}</span>
                </div>
                {isCurrent && <i className="ri-check-line font-bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
