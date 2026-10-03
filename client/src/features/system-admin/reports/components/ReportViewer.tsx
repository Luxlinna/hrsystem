import { memo } from "react";
import type { ReportConfig, ReportRow } from "../types";
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

  return (
    <div className="flex-1 min-w-0">
      {/* Summary KPI Cards */}
      <ReportSummaryBar summary={summary} />

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
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
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Querying live database records...</p>
          </div>
        ) : displayRows.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-xl mx-auto mb-2">
              <i className="ri-file-search-line" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No records found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting the date range, status, or search filters.
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
