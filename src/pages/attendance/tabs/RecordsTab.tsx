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
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const RecordsTab = memo(function RecordsTab({
  filteredRecords,
  pagedRecords,
  viewMode,
  todayYMD,
  canManage,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
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
      {viewMode === "table" ? (
        <AttendanceTableView
          records={pagedRecords}
          todayYMD={todayYMD}
          canManage={canManage}
          onSelectRecord={onSelectRecord}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
        />
      ) : (
        <AttendanceCardsView
          records={pagedRecords}
          todayYMD={todayYMD}
          canManage={canManage}
          onSelectRecord={onSelectRecord}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
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
