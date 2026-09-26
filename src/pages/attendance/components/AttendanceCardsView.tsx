import { memo, useMemo } from "react";
import type { AttendanceRecord } from "../types";
import type { Holiday } from "@/services/holidays/holidaysService";
import { AttendanceCardItem } from "./AttendanceCardItem";

interface AttendanceCardsViewProps {
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

export const AttendanceCardsView = memo(function AttendanceCardsView({
  records,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  holidays = [],
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceCardsViewProps) {
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((r) => (
        <AttendanceCardItem
          key={r.id}
          record={r}
          holiday={holidayMap.get(r.date)}
          todayYMD={todayYMD}
          canManage={canManage}
          isFourPunchMode={isFourPunchMode}
          onSelectRecord={onSelectRecord}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
          onLogTimeForEmployee={onLogTimeForEmployee}
        />
      ))}
    </div>
  );
});
