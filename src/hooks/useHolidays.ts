import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type Holiday,
  getHolidaysForYear,
  getHolidaysForDateRange,
  syncCambodiaHolidays,
  createCustomHoliday,
  deleteHoliday,
  findHolidayForDate,
} from "@/services/holidays/holidaysService";
import { todayYMD } from "@/lib/date";

export function useHolidays(branchId?: string | null, initialYear?: number) {
  const currentYear = initialYear || new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadHolidays = useCallback(async (targetYear: number) => {
    setLoading(true);
    try {
      const data = await getHolidaysForYear(targetYear, branchId);
      setHolidays(data);
    } catch (err) {
      console.error("[useHolidays] Failed to load holidays:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadHolidays(year);
  }, [year, loadHolidays]);

  const syncYear = useCallback(
    async (targetYear: number) => {
      setSyncing(true);
      try {
        const res = await syncCambodiaHolidays(targetYear, branchId);
        await loadHolidays(targetYear);
        return res;
      } finally {
        setSyncing(false);
      }
    },
    [branchId, loadHolidays]
  );

  const todayStr = useMemo(() => todayYMD(), []);
  const todayHoliday = useMemo(
    () => findHolidayForDate(todayStr, holidays),
    [todayStr, holidays]
  );

  const isHolidayDate = useCallback(
    (dateStr: string) => findHolidayForDate(dateStr, holidays),
    [holidays]
  );

  const addHoliday = useCallback(
    async (holiday: Omit<Holiday, "id" | "created_at">) => {
      const res = await createCustomHoliday(holiday);
      if (res.success) {
        await loadHolidays(holiday.year);
      }
      return res;
    },
    [loadHolidays]
  );

  const removeHoliday = useCallback(
    async (idOrDate: string, targetYear?: number) => {
      const res = await deleteHoliday(idOrDate, targetYear || year);
      if (res.success) {
        await loadHolidays(targetYear || year);
      }
      return res;
    },
    [year, loadHolidays]
  );

  return {
    year,
    setYear,
    holidays,
    loading,
    syncing,
    todayHoliday,
    isHolidayDate,
    loadHolidays,
    syncYear,
    addHoliday,
    removeHoliday,
    getHolidaysForDateRange,
  };
}
