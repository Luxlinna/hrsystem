import { supabase } from "@/lib/supabase";
import type { Holiday } from "./holidayTypes";
import { CAMBODIA_HOLIDAYS_FALLBACK } from "./holidayFallbacks";
import { getCachedHolidays, saveCachedHolidays } from "./holidayCache";
import { fetchCambodiaHolidaysFromApi } from "./holidayApi";

/**
 * Load holidays for a specific year from Supabase, local cache, or Cambodia API
 */
export async function getHolidaysForYear(year: number, branchId?: string | null): Promise<Holiday[]> {
  // 1. Try reading from Supabase
  try {
    let query = supabase
      .from("holidays")
      .select("*")
      .eq("year", year)
      .is("deleted_at", null);

    if (branchId) {
      query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
    } else {
      query = query.is("branch_id", null);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (!error && data && data.length > 0) {
      saveCachedHolidays(year, data as Holiday[]);
      return data as Holiday[];
    }
  } catch (err) {
    console.warn(`[HolidaysService] Supabase read failed, checking fallback:`, err);
  }

  // 2. Check local storage cache
  const cached = getCachedHolidays(year);
  if (cached && cached.length > 0) {
    return cached;
  }

  // 3. Fetch from API or built-in fallback
  const apiHolidays = await fetchCambodiaHolidaysFromApi(year);
  if (apiHolidays.length > 0) {
    saveCachedHolidays(year, apiHolidays);
    return apiHolidays;
  }

  return (CAMBODIA_HOLIDAYS_FALLBACK[year] || []).map((h) => ({ ...h }));
}

/**
 * Load holidays across a date range (handles cross-year periods)
 */
export async function getHolidaysForDateRange(
  startDate: string,
  endDate: string,
  branchId?: string | null
): Promise<Holiday[]> {
  const startYear = parseInt(startDate.substring(0, 4), 10) || new Date().getFullYear();
  const endYear = parseInt(endDate.substring(0, 4), 10) || startYear;

  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  const allHolidaysPromises = years.map((y) => getHolidaysForYear(y, branchId));
  const results = await Promise.all(allHolidaysPromises);
  const combined = results.flat();

  // Deduplicate and filter strictly inside the date range
  const uniqueMap = new Map<string, Holiday>();
  combined.forEach((h) => {
    if (h.date >= startDate && h.date <= endDate) {
      uniqueMap.set(h.date, h);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check if a date string is a holiday
 */
export function findHolidayForDate(dateStr: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((h) => h.date === dateStr);
}
