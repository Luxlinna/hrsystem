import { useState, memo, useMemo } from "react";
import type { AttendanceRecord } from "../types";
import type { Holiday } from "@/services/holidays/holidaysService";
import type { ManagedShift } from "./shifts-manager/types";
import { AttendanceTableHeader } from "./AttendanceTableHeader";
import { AttendanceTableRow } from "./AttendanceTableRow";

interface AttendanceTableViewProps {
  records: AttendanceRecord[];
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  holidays?: Holiday[];
  shifts?: ManagedShift[];
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
  shifts = [],
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <AttendanceTableHeader
            allSelected={allSelected}
            onToggleSelectAll={handleToggleSelectAll}
          />
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {records.map((record, idx) => (
              <AttendanceTableRow
                key={record.id}
                record={record}
                index={idx}
                isSelected={selectedIds.has(record.id)}
                onToggleSelect={handleToggleSelect}
                todayYMD={todayYMD}
                canManage={canManage}
                isFourPunchMode={isFourPunchMode}
                holidayMap={holidayMap}
                shifts={shifts}
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
