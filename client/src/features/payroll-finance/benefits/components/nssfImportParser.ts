export interface ImportRow {
  id?: string;
  nssf_number?: string;
  kh_name?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  basic_salary?: number;
  _name?: string;
}

export const EXPECTED_HEADERS = [
  "Employee ID",
  "NSSF Number",
  "Name (Khmer)",
  "Nationality",
  "Gender",
  "Date of Birth",
  "Basic Salary (USD)",
];

export async function parseNssfFile(f: File): Promise<{ rows?: ImportRow[]; error?: string }> {
  const isCSV = f.name.endsWith(".csv");
  const isXLSX = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");

  if (!isCSV && !isXLSX) {
    return { error: "Only .csv, .xlsx, or .xls files are supported." };
  }

  try {
    let raw: Record<string, any>[] = [];

    if (isCSV) {
      const text = (await f.text()).replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        return { error: "The CSV file appears to be empty or has only a header row." };
      }

      const tokenise = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuote && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuote = !inQuote;
            }
          } else if (ch === "," && !inQuote) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += ch;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = tokenise(lines[0]);
      raw = lines.slice(1).map((line) => {
        const vals = tokenise(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] ?? "";
        });
        return row;
      });
    } else {
      const XLSX = await import("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" }) as unknown as import("xlsx").WorkBook;

      const sheetKeys = Object.keys(wb.Sheets ?? {});
      const wsName = wb.SheetNames?.[0] || sheetKeys[0];
      if (!wsName || !wb.Sheets[wsName]) {
        return { error: "Could not read the Excel file — no sheets found." };
      }
      raw = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { defval: "" }) as Record<string, any>[];
    }

    if (raw.length === 0) {
      return { error: "The file appears to be empty." };
    }

    const get = (row: Record<string, any>, ...keys: string[]): string => {
      for (const k of keys) {
        const found = Object.keys(row).find(
          (rk) => rk.replace(/^\uFEFF/, "").trim().toLowerCase() === k.toLowerCase()
        );
        if (found !== undefined && row[found] !== "" && row[found] != null) {
          return String(row[found]).trim();
        }
      }
      return "";
    };

    const rows: ImportRow[] = raw.map((r) => ({
      id: get(r, "Employee ID", "employee_id", "ID", "emp_id") || undefined,
      nssf_number: get(r, "NSSF Number", "nssf_number", "NSSF No.", "NSSF") || undefined,
      kh_name: get(r, "Name (Khmer)", "kh_name", "Khmer Name", "Name KH") || undefined,
      nationality: get(r, "Nationality", "nationality") || undefined,
      gender: get(r, "Gender", "gender", "Sex") || undefined,
      date_of_birth: (() => {
        const v = get(r, "Date of Birth", "date_of_birth", "DOB", "DateOfBirth", "Birthday");
        if (!v) return undefined;
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
      })(),
      basic_salary: (() => {
        const v = get(r, "Basic Salary (USD)", "basic_salary", "Salary", "Basic Salary");
        return v !== "" ? Number(v) || undefined : undefined;
      })(),
      _name: get(r, "Name (English)", "Name", "Full Name", "English Name", "first_name") || undefined,
    }));

    const validRows = rows.filter((r) => r.id || r.nssf_number);
    if (validRows.length === 0) {
      const firstRow = raw[0];
      const found = firstRow
        ? Object.keys(firstRow).map((k) => k.replace(/^\uFEFF/, "")).join(", ")
        : "(none)";
      return {
        error:
          `No valid rows found. Columns detected: [${found}]. ` +
          `File must contain an "Employee ID" or "NSSF Number" column.`,
      };
    }

    return { rows: validRows };
  } catch (err: any) {
    return {
      error: `Parse error: ${err?.message ?? "Unknown error — please check the file format."}`,
    };
  }
}

export async function downloadNssfTemplate() {
  const XLSX = await import("xlsx");
  const sampleData = [
    {
      "Employee ID": "EMP001",
      "NSSF Number": "NSS123456",
      "Name (English)": "John Doe",
      "Name (Khmer)": "ចន ដូ",
      Nationality: "Cambodian",
      Gender: "Male",
      "Date of Birth": "1990-01-15",
      "Basic Salary (USD)": 350,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws["!cols"] = EXPECTED_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "NSSF Import Template");
  XLSX.writeFile(wb, "nssf_import_template.xlsx");
}
