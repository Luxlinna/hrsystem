export function cleanKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function cleanHtmlString(str?: string | null): string {
  if (!str) return "";
  let s = String(str).trim();

  // Decode decimal HTML entities e.g. &#6082; or #6082;
  s = s.replace(/(?:&amp;|&)?#(\d+);?/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      if (code === 8212 || code === 8211 || code === 8209 || code === 45) return "";
      return String.fromCodePoint(code);
    } catch {
      return "";
    }
  });

  // Decode hex HTML entities e.g. &#xB212; or &#B212; or #xB212;
  s = s.replace(/(?:&amp;|&)?#x?([0-9a-fA-F]+);?/gi, (full, hex) => {
    if (hex.toLowerCase() === "b212" || full.includes("B212") || full.includes("8212")) {
      return "";
    }
    try {
      const code = parseInt(hex, 16);
      if (code === 8212 || code === 8211) return "";
      return String.fromCodePoint(code);
    } catch {
      return "";
    }
  });

  s = s.replace(/&mdash;|&ndash;/gi, "");
  s = s.replace(/&amp;/gi, "&");
  s = s.trim();

  if (s === "—" || s === "-" || s === "N/A" || s === "n/a" || s === "null" || s === "undefined") {
    return "";
  }
  return s;
}

export function extractVal(row: Record<string, any>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  const normalizedKeys = possibleKeys.map(cleanKey);

  for (const rk of rowKeys) {
    const cleanedRk = cleanKey(rk);
    if (normalizedKeys.includes(cleanedRk)) {
      const val = row[rk];
      if (val != null) {
        const cleaned = cleanHtmlString(String(val));
        if (cleaned) {
          return cleaned;
        }
      }
    }
  }
  return "";
}

export function normalizeGender(val: string): string {
  const g = cleanHtmlString(val).toLowerCase().trim();
  if (g.includes("female") || g === "f" || g === "ស្រី") return "Female";
  if (g.includes("other") || g === "o" || g.includes("ផ្សេង")) return "Other";
  return "Male";
}

export function normalizeStatus(val?: string | null): "active" | "onboarding" | "on_leave" | "suspended" | "inactive" {
  if (!val) return "active";
  const st = cleanHtmlString(String(val)).toLowerCase().trim().replace(/[\s_-]+/g, "_");
  if (st === "onboarding" || st.includes("not") || st.includes("pending")) return "onboarding";
  if (st.includes("leave")) return "on_leave";
  if (st.includes("suspend") || st.includes("black")) return "suspended";
  if (st === "inactive" || st.includes("exit") || st.includes("deactivat") || st.includes("terminat") || st.includes("resign")) return "inactive";
  return "active";
}

export function parseExcelDate(val: any): string | undefined {
  if (val == null) return undefined;

  // 1. If Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getUTCFullYear();
      const m = String(val.getUTCMonth() + 1).padStart(2, "0");
      const d = String(val.getUTCDate()).padStart(2, "0");
      if (y >= 1900 && y <= 2100) return `${y}-${m}-${d}`;
    }
    return undefined;
  }

  // 2. If Excel serial date code (number or string of 4-6 digits)
  const num = typeof val === "number" ? val : (typeof val === "string" && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? Number(val.trim()) : NaN);
  if (!isNaN(num) && num > 1000 && num < 100000) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      if (y >= 1900 && y <= 2100) return `${y}-${m}-${d}`;
    }
    return undefined;
  }

  const str = cleanHtmlString(String(val)).trim();
  if (!str || str === "Never") return undefined;

  // 3. Handle YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const yNum = Number(y);
    if (yNum >= 1900 && yNum <= 2100) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // 4. Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})/);
  if (dmyMatch) {
    const [, p1, p2, y] = dmyMatch;
    const yNum = Number(y);
    if (yNum >= 1900 && yNum <= 2100) {
      let d = p1;
      let m = p2;
      if (Number(p1) > 12) {
        d = p1;
        m = p2;
      } else if (Number(p2) > 12) {
        d = p2;
        m = p1;
      }
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // 5. General Date parse with range validation
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${m}-${d}`;
    }
  }

  return undefined;
}

export function parseSalary(val: any): number | null {
  if (val == null) return null;
  const str = String(val).replace(/[^0-9.]/g, "");
  if (!str) return null;
  const num = Number(str);
  return isNaN(num) ? null : num;
}

export function isRowCompletelyEmpty(row: Record<string, any>): boolean {
  return Object.values(row).every((v) => {
    if (v == null) return true;
    const str = String(v).trim();
    return str === "" || str === "—" || str === "-";
  });
}
