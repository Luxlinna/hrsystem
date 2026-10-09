import { toast } from "@/components/Toast";
import { read as xlsxRead, utils as xlsxUtils, writeFile as xlsxWriteFile } from "xlsx";
import type { Branch } from "../../types";
import { TEMPLATE_HEADERS, type ParsedEmployeeRow, type ColumnMappingState } from "./types";
import { extractVal, cleanHtmlString, normalizeGender, normalizeStatus, parseExcelDate, parseSalary, isRowCompletelyEmpty } from "./fieldNormalizer";

export async function downloadEmployeeTemplate(branches: Branch[]) {
  try {
    const ws = xlsxUtils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [
        "EMP001", "Sok Dara", "សុខ តារា", "Male", "Mr", "1998-05-20", "010203040",
        "012345678", "dara.sok@example.com", branches[0]?.name || "Main BU", "Main Office",
        "Operations", "Staff", "FULL-TIME", "Junior", "2026-01-15", "PERMANENT (UDC)",
        "ABA Bank", "000123456", "123456789", "Phnom Penh",
      ],
    ]);
    ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, "Employee Import Template");
    xlsxWriteFile(wb, "employee_import_template.xlsx");
    toast("Template Ready", "Downloaded Employee Import template (.xlsx)", "success");
  } catch (e) {
    console.error(e);
    toast("Download Failed", "Could not generate Excel template", "error");
  }
}

export async function scanSpreadsheetFile(file: File): Promise<{
  headers: string[];
  rawRows: Record<string, any>[];
}> {
  // The xlsx alias in vite.config points to src/lib/xlsx.ts (a custom shim).
  // Its read() is async and accepts ArrayBuffer | Uint8Array only.
  const buffer = await file.arrayBuffer();
  const wb = await xlsxRead(buffer, { type: "array" });

  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    toast("Empty File", "The uploaded file has no sheets.", "error");
    return { headers: [], rawRows: [] };
  }
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];

  // The custom shim stores data as a 2D array in ws.data (not standard xlsx cell objects)
  const grid: any[][] = (worksheet?.data as any[][]) || [];

  if (!grid || grid.length === 0) {
    toast("Empty File", "The uploaded sheet contains no data rows.", "error");
    return { headers: [], rawRows: [] };
  }

  // Find header row: search first 10 rows for matching column keywords
  let headerRowIndex = 0;
  const keywords = [
    "employee", "name", "code", "id", "date", "status", "department", "position",
    "division", "bu", "business", "site", "contract", "salary", "supervisor", "no"
  ];

  let maxScore = 0;
  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const row = grid[r] || [];
    let score = 0;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const s = String(cell || "").toLowerCase().trim();
      if (keywords.some((kw) => s.includes(kw))) {
        score++;
      }
    }
    if (score > maxScore && score >= 2) {
      maxScore = score;
      headerRowIndex = r;
    }
  }

  const headerRow = grid[headerRowIndex] || [];
  const rawHeaders: string[] = [];
  for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
    const str = String(headerRow[colIdx] ?? "").trim();
    rawHeaders.push(str || `col_${colIdx}`);
  }

  const headers = rawHeaders.filter((h) => h && !h.startsWith("col_"));

  const rawRows: Record<string, any>[] = [];
  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    let hasAnyVal = false;
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== null && row[c] !== undefined && String(row[c]).trim() !== "") {
        hasAnyVal = true;
        break;
      }
    }
    if (!hasAnyVal) continue;

    const rowObj: Record<string, any> = {};
    for (let colIdx = 0; colIdx < Math.max(rawHeaders.length, row.length); colIdx++) {
      const h = rawHeaders[colIdx] || `col_${colIdx}`;
      const val = row[colIdx] ?? "";
      rowObj[h] = val;
      rowObj[`__col_${colIdx}`] = val;
    }
    rawRows.push(rowObj);
  }

  return { headers, rawRows };
}

export function transformRowsWithMapping(
  rawRows: Record<string, any>[],
  mapping: ColumnMappingState
): ParsedEmployeeRow[] {
  return rawRows.map((row, idx) => {
    const errors: string[] = [];
    const getMapped = (key: string): string => {
      const header = mapping[key];
      if (!header || row[header] == null) return "";
      const cleaned = cleanHtmlString(String(row[header]));
      return cleaned === "—" || cleaned === "-" ? "" : cleaned;
    };

    const getRaw = (key: string): any => {
      const header = mapping[key];
      if (!header) return undefined;
      return row[header];
    };

    // 1. Personal Identity
    let fullName = getMapped("fullName") || extractVal(row, ["Employee Name", "Full Name", "Name", "fullname", "first_name"]);
    const firstName = getMapped("firstName");
    const lastName = getMapped("lastName");
    if (!fullName && (firstName || lastName)) {
      fullName = `${lastName} ${firstName}`.trim();
    }
    if (!fullName) errors.push("Missing Full Name");

    const khName = getMapped("khName") || extractVal(row, ["Khmer Name", "KH Name", "kh_name"]);
    const employeeCode = getMapped("employeeCode") || extractVal(row, ["Employee ID", "Employee Code", "id"]);
    const gender = normalizeGender(getMapped("gender") || extractVal(row, ["Gender", "Sex"]));
    const title = getMapped("title") || "Mr";
    const dob = parseExcelDate(getRaw("dob") ?? extractVal(row, ["Date of Birth", "DOB"]));
    const maritalStatus = getMapped("maritalStatus") || "Single";
    const nationality = getMapped("nationality") || "Khmer";
    const nationalId = getMapped("nationalId") || extractVal(row, ["National ID", "ID Card", "national_id"]);
    const taxNumber = getMapped("taxNumber") || extractVal(row, ["Employee Tax Number", "tax_id"]);

    // 2. Organization & Workplace
    const buName = getMapped("buName") || extractVal(row, ["Branch / BU", "Business Unit", "BU", "Branch"]);
    const siteName = getMapped("siteName") || extractVal(row, ["Work Location", "Site", "Location"]);
    const department = getMapped("department") || extractVal(row, ["Department", "Dept"]) || "";
    const division = getMapped("division") || extractVal(row, ["Division"]);
    const position = getMapped("position") || extractVal(row, ["Position / Role", "Position", "Role"]) || "Staff";
    const reportsTo = getMapped("reportsTo") || extractVal(row, ["Reports To", "Line Manager"]);

    // 3. Terms & Schedule
    const employmentType = getMapped("employmentType") || extractVal(row, ["Employment Type", "Type"]) || "FULL-TIME";
    const employeeLevel = getMapped("employeeLevel") || extractVal(row, ["Employee Level", "Level"]);
    const joinDate = parseExcelDate(getRaw("joinDate") ?? extractVal(row, ["Joining Date", "Join Date", "Start Date"])) || new Date().toISOString().slice(0, 10);
    const contractType = getMapped("contractType") || extractVal(row, ["Contract Type", "Contract"]) || "PERMANENT (UDC)";
    const contractEndDate = parseExcelDate(getRaw("contractEndDate") ?? extractVal(row, ["Contract End Date"]));
    const status = normalizeStatus(getMapped("status") || extractVal(row, ["Employment Status", "Status", "Job Status"]));

    // 4. Compensation & Payroll
    const basicSalary = parseSalary(getMapped("basicSalary") || extractVal(row, ["Basic Salary / Rate", "Basic Salary", "Salary"]));
    const bankName = getMapped("bankName") || extractVal(row, ["Bank Name"]);
    const bankAccountNumber = getMapped("bankAccountNumber") || extractVal(row, ["Bank Account Number", "Account Number"]);
    const nssfNumber = getMapped("nssfNumber") || extractVal(row, ["NSSF Number", "NSSF"]);
    const payrollStructure = getMapped("payrollStructure") || "Standard Monthly";

    // 5. Contacts & Address
    const email = getMapped("email") || extractVal(row, ["Email", "Email Address"]);
    const phone = getMapped("phone") || extractVal(row, ["Phone", "Phone Number"]);
    const currentAddress = getMapped("currentAddress") || extractVal(row, ["Current Address", "Address"]);
    const permanentAddress = getMapped("permanentAddress") || extractVal(row, ["Permanent Address"]);
    const emergencyContactName = getMapped("emergencyContactName") || extractVal(row, ["Emergency Contact Name"]);
    const emergencyPhone = getMapped("emergencyPhone") || extractVal(row, ["Emergency Phone"]);
    const biometricId = getMapped("biometricId") || extractVal(row, ["Biometric Device ID", "Biometric ID"]);

    return {
      rowNumber: idx + 2,
      fullName, firstName, lastName, khName, employeeCode, gender, title, dob,
      maritalStatus, nationality, nationalId, taxNumber, buName, siteName,
      department, division, position, role: position, reportsTo,
      employmentType, employeeLevel, joinDate, contractType, contractEndDate, status,
      basicSalary, bankName, bankAccountNumber, nssfNumber, payrollStructure,
      email, phone, currentAddress, permanentAddress, emergencyContactName,
      emergencyPhone, biometricId,
      isValid: errors.length === 0,
      errors,
    };
  });
}
