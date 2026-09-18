import { supabase } from "@/lib/supabase";
import type { Holiday } from "./holidayTypes";
import { fetchCambodiaHolidaysFromApi } from "./holidayApi";
import { getCachedHolidays, saveCachedHolidays } from "./holidayCache";
import { getHolidaysForYear } from "./holidayQueryService";

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
