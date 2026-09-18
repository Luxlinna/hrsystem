import { memo, useMemo } from "react";
import type { AttendanceRecord } from "../types";
import type { Holiday } from "@/services/holidays/holidaysService";
import { AttendanceTableHeader } from "./AttendanceTableHeader";
import { AttendanceTableRow } from "./AttendanceTableRow";

interface AttendanceTableViewProps {
  records: AttendanceRecord[];
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  holidays?: Holiday[];
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

export const AttendanceTableView = memo(function AttendanceTableView({
  records,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  holidays = [],
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceTableViewProps) {
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
      {isFourPunchMode && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
              <i className="ri-time-line text-xs text-indigo-600 dark:text-indigo-400" />
              4-Punch Multi-Session Shift Active
            </span>
            <span className="text-gray-400 dark:text-slate-400 text-[11px] hidden sm:inline">
              Morning In · Lunch Out · Lunch In · Evening Out
            </span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-slate-700">
            {records.length} Record{records.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <AttendanceTableHeader isFourPunchMode={isFourPunchMode} />
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {records.map((record) => (
              <AttendanceTableRow
                key={record.id}
                record={record}
                todayYMD={todayYMD}
                canManage={canManage}
                isFourPunchMode={isFourPunchMode}
                holidayMap={holidayMap}
                onSelectRecord={onSelectRecord}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
                onLogTimeForEmployee={onLogTimeForEmployee}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
