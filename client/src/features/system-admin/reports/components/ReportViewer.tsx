import { memo } from "react";
import type { ReportConfig, ReportRow } from "../types";
import { MODULES } from "../constants";
import { useReportFetcher } from "../hooks/useReportFetcher";
import { useReportViewerPagination } from "../hooks/useReportViewerPagination";
import { ReportSummaryBar } from "./viewer/ReportSummaryBar";
import { ReportViewerToolbar } from "./viewer/ReportViewerToolbar";
import { ReportViewerTable } from "./viewer/ReportViewerTable";
import { ReportViewerPagination } from "./viewer/ReportViewerPagination";

interface ReportViewerProps {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

export default memo(function ReportViewer({ config, onDataReady }: ReportViewerProps) {
  const { rows, columns, loading, summary } = useReportFetcher({
    config,
    onDataReady,
  });

  const {
    pageSize,
    setPageSize,
    page,
    setPage,
    inTableSearch,
    setInTableSearch,
    density,
    setDensity,
    displayRows,
    totalPages,
    pagedRows,
    pageStart,
    pageEnd,
    pageWindow,
  } = useReportViewerPagination(rows);

  const activeModInfo = MODULES.find((m) => m.id === config.module) || MODULES[0];

  return (
    <div className="flex-1 min-w-0">
      {/* Summary KPI Cards */}
      <ReportSummaryBar summary={summary} />

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {/* Module Title Banner */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
              <i className={`${activeModInfo.icon} text-base`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {activeModInfo.label}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {rows.length} {rows.length === 1 ? "record" : "records"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {activeModInfo.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Instant Search & Table Controls */}
        <ReportViewerToolbar
          inTableSearch={inTableSearch}
          setInTableSearch={setInTableSearch}
          pageSize={pageSize}
          setPageSize={setPageSize}
          density={density}
          setDensity={setDensity}
        />

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Querying live database records...</p>
          </div>
        ) : displayRows.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-2">
              <i className="ri-file-search-line" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No records match current filters</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting the date range, status, or search filters in the controls panel.
            </p>
          </div>
        ) : (
          <ReportViewerTable
            columns={columns}
            pagedRows={pagedRows}
            density={density}
          />
        )}

        {/* Pagination bar */}
        {!loading && displayRows.length > 0 && (
          <ReportViewerPagination
            pageStart={pageStart}
            pageEnd={pageEnd}
            totalDisplayRows={displayRows.length}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            pageWindow={pageWindow(page, totalPages)}
          />
        )}
      </div>
    </div>
  );
});
