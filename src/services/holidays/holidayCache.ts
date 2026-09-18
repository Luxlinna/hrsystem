import type { Holiday } from "./holidayTypes";

const LOCAL_STORAGE_KEY_PREFIX = "cambodia_holidays_cache_";

/**
 * Get holidays from local storage cache
 */
export function getCachedHolidays(year: number): Holiday[] | null {
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
export function saveCachedHolidays(year: number, holidays: Holiday[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${year}`, JSON.stringify(holidays));
  } catch {
    // Ignore localStorage errors
  }
}
