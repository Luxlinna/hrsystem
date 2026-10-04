import {
  isSilDay,
  toKhmerLunarDate,
  formatKhmerDate,
} from "khmer-chhankitek-calendar";
import type { KhmerLunarDayInfo } from "./holidayTypes";

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
