import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Booking, MeetingRoom } from "../types";
import {
  exportMeetingRoomsPDF,
  exportMeetingRoomsXLSX,
  exportMeetingRoomsCSV,
} from "../exportUtils";

interface MeetingRoomsExportMenuProps {
  bookings: Booking[];
  rooms: MeetingRoom[];
  selectedDate?: string;
  disabled?: boolean;
}

type Format = "pdf" | "xlsx" | "csv";
type Scope = "day" | "month" | "all";

export const MeetingRoomsExportMenu = memo(function MeetingRoomsExportMenu({
  bookings,
  rooms,
  selectedDate,
  disabled = false,
}: MeetingRoomsExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("day");
  const [exporting, setExporting] = useState<Format | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentDateStr = selectedDate || new Date().toISOString().slice(0, 10);
  const currentMonthStr = currentDateStr.slice(0, 7);

  // Filter bookings based on active export scope (Day / Month / All)
  const scopedBookings = useMemo(() => {
    if (scope === "day") {
      return bookings.filter((b) => b.date === currentDateStr);
    }
    if (scope === "month") {
      return bookings.filter((b) => b.date && b.date.startsWith(currentMonthStr));
    }
    return bookings;
  }, [bookings, scope, currentDateStr, currentMonthStr]);

  const scopeLabel = useMemo(() => {
    if (scope === "day") return currentDateStr;
    if (scope === "month") {
      const [y, m] = currentMonthStr.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(m, 10) - 1;
      return `${monthNames[mIdx] || m} ${y}`;
    }
    return "All Time";
  }, [scope, currentDateStr, currentMonthStr]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = useCallback(
    async (fmt: Format) => {
      setExporting(fmt);
      setOpen(false);
      try {
        const fileTag = scope === "day" ? currentDateStr : scope === "month" ? currentMonthStr : "all_records";
        if (fmt === "pdf") {
          exportMeetingRoomsPDF(scopedBookings, rooms, fileTag, `Meeting Schedule (${scopeLabel})`);
        } else if (fmt === "xlsx") {
          exportMeetingRoomsXLSX(scopedBookings, rooms, fileTag);
        } else if (fmt === "csv") {
          exportMeetingRoomsCSV(scopedBookings, rooms, fileTag);
        }
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [scopedBookings, rooms, scope, currentDateStr, currentMonthStr, scopeLabel]
  );

  const exportOptions = [
    {
      fmt: "pdf" as Format,
      label: "PDF Report",
      ext: ".pdf",
      desc: "Print-ready reservations audit",
      icon: "ri-file-pdf-line",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40",
    },
    {
      fmt: "xlsx" as Format,
      label: "Excel Workbook",
      ext: ".xlsx",
      desc: "Structured OpenXML spreadsheet",
      icon: "ri-file-excel-2-line",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40",
    },
    {
      fmt: "csv" as Format,
      label: "CSV Records",
      ext: ".csv",
      desc: "Comma-separated raw data",
      icon: "ri-file-text-line",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40",
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200/90 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95 whitespace-nowrap"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <i className="ri-download-2-line text-sm text-[#253C7D] dark:text-sky-400" />
        )}
        <span>{exporting ? "Exporting..." : "Export"}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Scope Filter Header */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Export Scope
              </span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                {scopedBookings.length} bookings
              </span>
            </div>

            {/* Scope Segmented Filter */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl">
              {[
                { id: "day", label: "Date", sub: currentDateStr.slice(5) },
                { id: "month", label: "Month", sub: scopeLabel.split(" ")[0] },
                { id: "all", label: "All", sub: `${bookings.length}` },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScope(s.id as Scope)}
                  className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    scope === s.id
                      ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <div className="text-[11px] leading-tight">{s.label}</div>
                  <div className="text-[9px] opacity-75 font-mono truncate">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="px-1 py-1 border-t border-gray-100 dark:border-slate-800 mb-1">
            <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Choose Format
            </span>
          </div>

          {/* Formats */}
          <div className="space-y-0.5">
            {exportOptions.map((opt) => (
              <button
                key={opt.fmt}
                type="button"
                onClick={() => handleExport(opt.fmt)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-colors ${opt.color}`}
                >
                  <i className={opt.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors truncate">
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 ml-1">
                      {opt.ext}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    {opt.desc} ({scopedBookings.length})
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
