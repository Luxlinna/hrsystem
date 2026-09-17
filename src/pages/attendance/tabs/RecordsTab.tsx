import { memo } from "react";
import type { AttendanceRecord, ViewMode } from "../types";
import { Pagination } from "../components/Pagination";
import { AttendanceTableView } from "../components/AttendanceTableView";
import { AttendanceCardsView } from "../components/AttendanceCardsView";

interface RecordsTabProps {
  filteredRecords: AttendanceRecord[];
  pagedRecords: AttendanceRecord[];
  viewMode: ViewMode;
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
  totalRecordsCount?: number;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export const RecordsTab = memo(function RecordsTab({
  filteredRecords,
  pagedRecords,
  viewMode,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
  totalRecordsCount,
  onResetFilters,
  isFiltered,
}: RecordsTabProps) {
  if (filteredRecords.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-calendar-close-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Attendance Records Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No entries match your selected date range and filter parameters. Try switching to "All Historical Dates" or adjusting your search.
        </p>
      </div>
    );
  }

  return (
    <div>
      {isFiltered && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl text-xs text-blue-900 dark:text-blue-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <i className="ri-filter-3-fill text-[#253C7D] dark:text-sky-400 text-sm" />
            <span>
              Filters are active: Showing <strong>{filteredRecords.length}</strong> {totalRecordsCount !== undefined ? `of ${totalRecordsCount}` : ""} records.
            </span>
          </div>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer text-xs shrink-0"
            >
              <i className="ri-refresh-line" /> Clear Filters (Show All Dates)
            </button>
          )}
        </div>
      )}

      {viewMode === "table" ? (
        <AttendanceTableView
          records={pagedRecords}
          todayYMD={todayYMD}
          canManage={canManage}
          isFourPunchMode={isFourPunchMode}
          onSelectRecord={onSelectRecord}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
          onLogTimeForEmployee={onLogTimeForEmployee}
        />
      ) : (
        <AttendanceCardsView
          records={pagedRecords}
          todayYMD={todayYMD}
          canManage={canManage}
          isFourPunchMode={isFourPunchMode}
          onSelectRecord={onSelectRecord}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
          onLogTimeForEmployee={onLogTimeForEmployee}
        />
      )}

      <Pagination
        totalCount={filteredRecords.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
});
