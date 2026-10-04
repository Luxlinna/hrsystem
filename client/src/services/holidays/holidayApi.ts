import { getKhmerHolidays } from "khmer-chhankitek-calendar";
import type { Holiday } from "./holidayTypes";
import { CAMBODIA_HOLIDAYS_FALLBACK } from "./holidayFallbacks";

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
