export function cleanKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function extractVal(row: Record<string, any>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  const normalizedKeys = possibleKeys.map(cleanKey);

  for (const rk of rowKeys) {
    const cleanedRk = cleanKey(rk);
    if (normalizedKeys.includes(cleanedRk)) {
      const val = row[rk];
      if (val != null) {
        const str = String(val).trim();
        if (str !== "—" && str !== "-" && str !== "null" && str !== "undefined") {
          return str;
        }
      }
    }
  }
  return "";
}

export function normalizeGender(val: string): string {
  const g = val.toLowerCase().trim();
  if (g.includes("female") || g === "f" || g === "ស្រី") return "Female";
  if (g.includes("other") || g === "o" || g.includes("ផ្សេង")) return "Other";
  return "Male";
}

export function parseExcelDate(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "number") {
    // Excel serial date code
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str || str === "—" || str === "Never") return undefined;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
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
