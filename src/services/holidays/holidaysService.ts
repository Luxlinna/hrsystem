import { supabase } from "@/lib/supabase";

import {
  getKhmerHolidays,
  isSilDay,
  toKhmerLunarDate,
  formatKhmerDate,
} from "khmer-chhankitek-calendar";

export interface Holiday {
  id?: string;
  date: string; // YYYY-MM-DD
  name: string; // English name
  local_name?: string | null; // Khmer name
  year: number;
  is_paid: boolean;
  branch_id?: string | null;
  created_at?: string;
}

export interface KhmerLunarDayInfo {
  isSilDay: boolean;
  lunarDayShort: string; // e.g. "៦កើត", "១៥កើត", "៨រោច"
  khmerMonth: string; // e.g. "ភទ្របទ"
  animalYear: string; // e.g. "មមី"
  buddhistEraYear: number; // e.g. 2570
  fullText: string;
}

/**
 * Get authentic Khmer Lunar date information for any date
 */
export function getKhmerLunarInfo(dateInput: Date | string): KhmerLunarDayInfo {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput + "T00:00:00") : dateInput;
    const lunar = toKhmerLunarDate(d);
    const sil = isSilDay(d);
    const shortText = `${lunar.moonDayKhmer || lunar.moonDay}${lunar.moonStatus || ""}`;

    return {
      isSilDay: sil,
      lunarDayShort: shortText,
      khmerMonth: lunar.khmerMonth || "",
      animalYear: lunar.animalYear || "",
      buddhistEraYear: lunar.buddhistEraYear || 0,
      fullText: lunar.fullText || formatKhmerDate(d),
    };
  } catch {
    return {
      isSilDay: false,
      lunarDayShort: "",
      khmerMonth: "",
      animalYear: "",
      buddhistEraYear: 0,
      fullText: "",
    };
  }
}

// Built-in Cambodia Labor Law Public Holidays (Prakas / Official Calendar)
// Provides instant offline fallback and baseline data
export const CAMBODIA_HOLIDAYS_FALLBACK: Record<number, Omit<Holiday, "id" | "created_at">[]> = {
  2025: [
    { date: "2025-01-01", name: "New Year's Day", local_name: "ទិវាបុណ្យចូលឆ្នាំសកល", year: 2025, is_paid: true },
    { date: "2025-01-07", name: "Victory over Genocide Day", local_name: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", year: 2025, is_paid: true },
    { date: "2025-03-08", name: "International Women's Day", local_name: "ទិវានារីអន្តរជាតិ", year: 2025, is_paid: true },
    { date: "2025-04-14", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2025, is_paid: true },
    { date: "2025-04-15", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2025, is_paid: true },
    { date: "2025-04-16", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2025, is_paid: true },
    { date: "2025-05-01", name: "Labour Day", local_name: "ទិវាពលកម្មអន្តរជាតិ", year: 2025, is_paid: true },
    { date: "2025-05-11", name: "Visak Bochea Day", local_name: "ពិធីបុណ្យវិសាខបូជា", year: 2025, is_paid: true },
    { date: "2025-05-14", name: "King Sihamoni's Birthday", local_name: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា នរោត្តម សីហមុនី", year: 2025, is_paid: true },
    { date: "2025-05-15", name: "Royal Ploughing Ceremony", local_name: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល", year: 2025, is_paid: true },
    { date: "2025-06-18", name: "Queen Mother's Birthday", local_name: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ", year: 2025, is_paid: true },
    { date: "2025-09-21", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2025, is_paid: true },
    { date: "2025-09-22", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2025, is_paid: true },
    { date: "2025-09-23", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2025, is_paid: true },
    { date: "2025-09-24", name: "Constitution Day", local_name: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", year: 2025, is_paid: true },
    { date: "2025-10-15", name: "Commemoration Day of the King's Father", local_name: "ព្រះរាជពិធីគោរពព្រះវិញ្ញាណក្ខន្ធព្រះករុណាព្រះបាទសម្ដេចព្រះ នរោត្ដម សីហនុ", year: 2025, is_paid: true },
    { date: "2025-10-29", name: "Coronation Day of King Sihamoni", local_name: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិរបស់ព្រះករុណាព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្ដម សីហមុនី", year: 2025, is_paid: true },
    { date: "2025-11-04", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2025, is_paid: true },
    { date: "2025-11-05", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2025, is_paid: true },
    { date: "2025-11-06", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2025, is_paid: true },
    { date: "2025-11-09", name: "National Independence Day", local_name: "ទិវាបុណ្យឯករាជ្យជាតិ", year: 2025, is_paid: true },
    { date: "2025-12-29", name: "Cambodia Peace Day", local_name: "ទិវាសន្តិភាពនៅកម្ពុជា", year: 2025, is_paid: true },
  ],
  2026: [
    { date: "2026-01-01", name: "New Year's Day", local_name: "ទិវាបុណ្យចូលឆ្នាំសកល", year: 2026, is_paid: true },
    { date: "2026-01-07", name: "Victory over Genocide Day", local_name: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", year: 2026, is_paid: true },
    { date: "2026-03-08", name: "International Women's Day", local_name: "ទិវានារីអន្តរជាតិ", year: 2026, is_paid: true },
    { date: "2026-04-14", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2026, is_paid: true },
    { date: "2026-04-15", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2026, is_paid: true },
    { date: "2026-04-16", name: "Khmer New Year", local_name: "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", year: 2026, is_paid: true },
    { date: "2026-05-01", name: "Labour Day", local_name: "ទិវាពលកម្មអន្តរជាតិ", year: 2026, is_paid: true },
    { date: "2026-05-05", name: "Royal Ploughing Ceremony", local_name: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល", year: 2026, is_paid: true },
    { date: "2026-05-14", name: "King Sihamoni's Birthday", local_name: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា នរោត្តម សីហមុនី", year: 2026, is_paid: true },
    { date: "2026-06-18", name: "Queen Mother's Birthday", local_name: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ", year: 2026, is_paid: true },
    { date: "2026-09-24", name: "Constitution Day", local_name: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", year: 2026, is_paid: true },
    { date: "2026-10-10", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2026, is_paid: true },
    { date: "2026-10-11", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2026, is_paid: true },
    { date: "2026-10-12", name: "Pchum Ben", local_name: "ពិធីបុណ្យភ្ផុំបិណ្ឌ", year: 2026, is_paid: true },
    { date: "2026-10-15", name: "Commemoration Day of the King's Father", local_name: "ព្រះរាជពិធីគោរពព្រះវិញ្ញាណក្ខន្ធព្រះករុណាព្រះបាទសម្ដេចព្រះ នរោត្ដម សីហនុ", year: 2026, is_paid: true },
    { date: "2026-10-29", name: "Coronation Day of King Sihamoni", local_name: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិរបស់ព្រះករុណាព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្ដម សីហមុនី", year: 2026, is_paid: true },
    { date: "2026-11-09", name: "National Independence Day", local_name: "ទិវាបុណ្យឯករាជ្យជាតិ", year: 2026, is_paid: true },
    { date: "2026-11-23", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2026, is_paid: true },
    { date: "2026-11-24", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2026, is_paid: true },
    { date: "2026-11-25", name: "Water Festival", local_name: "ពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប អកអំបុក និងសំពះព្រះខែ", year: 2026, is_paid: true },
    { date: "2026-12-29", name: "Cambodia Peace Day", local_name: "ទិវាសន្តិភាពនៅកម្ពុជា", year: 2026, is_paid: true },
  ],
};

const LOCAL_STORAGE_KEY_PREFIX = "cambodia_holidays_cache_";

/**
 * Fetch and calculate Cambodia public holidays using the official Khmer Chhankitek
 * calendar algorithm (same as khmer-lunar-calendar.com) with English translations
 * and fallback to Nager.Date API or Prakas.
 */
export async function fetchCambodiaHolidaysFromApi(year: number): Promise<Holiday[]> {
  try {
    // 1. Calculate directly via authentic Khmer Chhankitek Lunisolar calendar engine
    const khmerHols = getKhmerHolidays(year);
    if (Array.isArray(khmerHols) && khmerHols.length > 0) {
      // Deduplicate by date, prioritizing 'public' type and complete English names
      const dateMap = new Map<string, Holiday>();
      for (const item of khmerHols) {
        const existing = dateMap.get(item.date);
        const newHol: Holiday = {
          date: item.date,
          name: item.nameEn,
          local_name: item.nameKm,
          year: year,
          is_paid: true,
          branch_id: null,
        };

        if (!existing) {
          dateMap.set(item.date, newHol);
        } else if (item.type === "public" && item.nameEn.length > existing.name.length) {
          // Prefer more descriptive name (e.g. "Pchum Ben Festival" over "Pchum Ben")
          dateMap.set(item.date, newHol);
        }
      }

      return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (err) {
    console.warn(`[HolidaysService] Khmer calendar calculation error:`, err);
  }

  // 2. Fallback to Nager.Date API if needed
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KH`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          date: item.date,
          name: item.name,
          local_name: item.localName || null,
          year: year,
          is_paid: true,
          branch_id: null,
        }));
      }
    }
  } catch {
    // Ignore network error
  }

  // 3. Static Prakas fallback
  return (CAMBODIA_HOLIDAYS_FALLBACK[year] || []).map((h) => ({ ...h }));
}

/**
 * Get holidays from local storage cache
 */
function getCachedHolidays(year: number): Holiday[] | null {
  try {
    const item = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${year}`);
    if (item) {
      return JSON.parse(item);
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Save holidays to local storage cache
 */
function saveCachedHolidays(year: number, holidays: Holiday[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${year}`, JSON.stringify(holidays));
  } catch {
    // Ignore localStorage errors
  }
}

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

/**
 * Sync / Upsert Cambodia Labor Law official holidays into Supabase
 */
export async function syncCambodiaHolidays(
  year: number,
  branchId?: string | null
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Fetch official list from API or fallback
    const holidays = await fetchCambodiaHolidaysFromApi(year);
    if (holidays.length === 0) {
      return { success: false, count: 0, error: "No holidays returned for year " + year };
    }

    // Always update local cache immediately
    saveCachedHolidays(year, holidays);

    // 2. Attempt to save in Supabase if table exists
    const recordsToInsert = holidays.map((h) => ({
      date: h.date,
      name: h.name,
      local_name: h.local_name,
      year: h.year,
      is_paid: h.is_paid,
      branch_id: branchId || null,
      updated_at: new Date().toISOString(),
    }));

    // First delete any previous standard holidays for this year/branch to avoid duplicates
    let delQuery = supabase
      .from("holidays")
      .delete()
      .eq("year", year);

    if (branchId) {
      delQuery = delQuery.eq("branch_id", branchId);
    } else {
      delQuery = delQuery.is("branch_id", null);
    }

    const { error: delError } = await delQuery;
    if (delError) {
      console.warn("[HolidaysService] Could not clear existing holidays in DB:", delError.message);
    }

    const { data, error: insertError } = await supabase
      .from("holidays")
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.warn("[HolidaysService] Could not insert holidays into Supabase:", insertError.message);
      // Even if DB insert fails (e.g. migration pending), we successfully synced to local cache
      return {
        success: true,
        count: holidays.length,
        error: "Saved locally (Supabase table may need migration): " + insertError.message,
      };
    }

    return { success: true, count: (data?.length || holidays.length) };
  } catch (err: any) {
    console.error("[HolidaysService] Sync failed:", err);
    return { success: false, count: 0, error: err?.message || "Sync failed" };
  }
}

/**
 * Add a custom company holiday
 */
export async function createCustomHoliday(
  holiday: Omit<Holiday, "id" | "created_at">
): Promise<{ success: boolean; holiday?: Holiday; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("holidays")
      .insert([{
        date: holiday.date,
        name: holiday.name,
        local_name: holiday.local_name || null,
        year: holiday.year,
        is_paid: holiday.is_paid ?? true,
        branch_id: holiday.branch_id || null,
      }])
      .select()
      .single();

    if (error) {
      // Fallback: save to cache
      const cached = getCachedHolidays(holiday.year) || [];
      const updated = [...cached.filter((h) => h.date !== holiday.date), holiday as Holiday];
      saveCachedHolidays(holiday.year, updated);
      return { success: true, holiday: holiday as Holiday };
    }

    // Refresh cache
    const yearHolidays = await getHolidaysForYear(holiday.year, holiday.branch_id);
    saveCachedHolidays(holiday.year, yearHolidays);

    return { success: true, holiday: data as Holiday };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create holiday" };
  }
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(
  idOrDate: string,
  year?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (idOrDate.includes("-")) {
      // It's a date YYYY-MM-DD
      const targetYear = year || parseInt(idOrDate.substring(0, 4), 10);
      await supabase.from("holidays").delete().eq("date", idOrDate);
      const cached = getCachedHolidays(targetYear) || [];
      saveCachedHolidays(targetYear, cached.filter((h) => h.date !== idOrDate));
    } else {
      // It's a UUID
      await supabase.from("holidays").delete().eq("id", idOrDate);
      if (year) {
        const cached = getCachedHolidays(year) || [];
        saveCachedHolidays(year, cached.filter((h) => h.id !== idOrDate));
      }
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete holiday" };
  }
}
