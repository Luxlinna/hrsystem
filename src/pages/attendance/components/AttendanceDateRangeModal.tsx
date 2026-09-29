import { useState, useRef, useEffect } from "react";
import type { DatePreset } from "../types";

interface AttendanceDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: DatePreset;
  fromDate: string;
  toDate: string;
  todayYMD: string;
  onApply: (preset: DatePreset, from: string, to: string) => void;
}

const PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "last_week", label: "Last week" },
  { id: "this_week", label: "This week" },
  { id: "last_month", label: "Last month" },
  { id: "this_month", label: "This month" },
  { id: "custom_range", label: "Custom" },
];

export function AttendanceDateRangeModal({
  isOpen,
  onClose,
  preset,
  fromDate,
  toDate,
  todayYMD,
  onApply,
}: AttendanceDateRangeModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(preset === "all" ? "today" : preset);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(fromDate || todayYMD);
  const [customTo, setCustomTo] = useState(toDate || todayYMD);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(preset === "all" ? "today" : preset);
      setCustomFrom(fromDate || todayYMD);
      setCustomTo(toDate || todayYMD);
      setIsDropdownOpen(false);
    }
  }, [isOpen, preset, fromDate, toDate, todayYMD]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentLabel =
    PRESET_OPTIONS.find((opt) => opt.id === selectedPreset)?.label || "Custom";

  const handleDone = () => {
    onApply(selectedPreset, customFrom, customTo);
    onClose();
  };

  return (
    <div
      ref={modalRef}
      className="absolute top-full mt-2 left-0 z-50 w-[340px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xl p-4 transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">
          Date Range
        </h4>
      </div>

      {/* Body: Period Frequency Selector */}
      <div className="py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3 relative">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Period Frequency
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="bg-[#2b8de3] hover:bg-[#2272b8] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 min-w-[110px] cursor-pointer shadow-xs transition-colors"
            >
              <span>{currentLabel}</span>
              <i className={`ri-arrow-down-s-fill text-xs transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100">
                {PRESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(opt.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      selectedPreset === opt.id
                        ? "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Range Inputs */}
        {selectedPreset === "custom_range" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Select Custom Dates
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions: Done & Discard */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleDone}
          className="px-3.5 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <i className="ri-checkbox-circle-line text-sm" />
          <span>Done</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <i className="ri-close-line text-sm" />
          <span>Discard</span>
        </button>
      </div>
    </div>
  );
}
