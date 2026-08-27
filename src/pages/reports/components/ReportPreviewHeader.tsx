import { useRef } from "react";
import { MODULES } from "../constants";
import { toYMD, todayYMD } from "@/lib/date";
import { getWeekRange, getMonthRange } from "../reportsUtils";
import { ExportMenu } from "./ExportMenu";
import ReportViewer from "./ReportViewer";
import type { ReportConfig, ReportRow } from "../types";

interface ReportPreviewHeaderProps {
  activeModule: string;
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], cols: string[]) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  isDateScoped: boolean;
  reportColumns: string[];
  reportData: ReportRow[];
}

export function ReportPreviewHeader(props: ReportPreviewHeaderProps) {
  const { activeModule, config, onDataReady, dateFrom, setDateFrom, dateTo, setDateTo, isDateScoped, reportColumns, reportData } = props;
  const activeModuleInfo = MODULES.find((m) => m.id === activeModule)!;
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${activeModuleInfo.color}`}>
            <i className={`${activeModuleInfo.icon} text-lg`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{activeModuleInfo.label}</h2>
              {isDateScoped && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-semibold">
                  {dateFrom === todayYMD() && dateTo === todayYMD()
                    ? "Per Day (Today)"
                    : dateFrom || dateTo
                      ? `${dateFrom || "Start"} → ${dateTo || "Today"}`
                      : "All Time"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {isDateScoped ? (dateFrom || dateTo ? `${dateFrom || "Start"} → ${dateTo || "Today"}` : "All time") : "Live snapshot"}
              {reportData.length > 0 && ` · ${reportData.length} records`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDateScoped && (
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => {
                  const t = todayYMD();
                  setDateFrom(t);
                  setDateTo(t);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateFrom === todayYMD() && dateTo === todayYMD()
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                Per Day
              </button>
              <button
                onClick={() => {
                  const w = getWeekRange();
                  setDateFrom(w.from);
                  setDateTo(w.to);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateFrom === getWeekRange().from && dateTo === getWeekRange().to
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                Per Week
              </button>
              <button
                onClick={() => {
                  const m = getMonthRange();
                  setDateFrom(m.from);
                  setDateTo(m.to);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateFrom === getMonthRange().from && dateTo === getMonthRange().to
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                Per Month
              </button>
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !dateFrom && !dateTo
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                All Time
              </button>
            </div>
          )}

          <ExportMenu
            activeModule={activeModule}
            reportColumns={reportColumns}
            reportData={reportData}
            dateFrom={dateFrom}
            dateTo={dateTo}
            isDateScoped={isDateScoped}
          />
        </div>
      </div>

      <div ref={printRef}>
        <ReportViewer
          config={config}
          onDataReady={onDataReady}
        />
      </div>
    </div>
  );
}
