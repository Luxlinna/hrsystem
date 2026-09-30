import { toast } from "@/components/Toast";
import type { Branch } from "../../types";
import { TEMPLATE_HEADERS, type ParsedEmployeeRow } from "./types";
import {
  extractVal,
  normalizeGender,
  parseExcelDate,
  parseSalary,
  isRowCompletelyEmpty,
} from "./fieldNormalizer";

export async function downloadEmployeeTemplate(branches: Branch[]) {
  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [
        "Sok Dara",
        "សុខ តារា",
        "Male",
        "Mr",
        "012345678",
        "dara.sok@example.com",
        branches[0]?.name || "Main BU",
        "Main Office",
        "Operations",
        "Staff",
        "Full-Time",
        "2026-01-15",
        "PERMANENT (UDC)",
        "350",
        "010203040",
        "1998-05-20",
        "Phnom Penh",
      ],
    ]);
    ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Import Template");
    XLSX.writeFile(wb, "employee_import_template.xlsx");
    toast("Template Ready", "Downloaded Employee Import template (.xlsx)", "success");
  } catch (e) {
    console.error(e);
    toast("Download Failed", "Could not generate Excel template", "error");
  }
}

export async function parseEmployeeFile(file: File): Promise<ParsedEmployeeRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = await XLSX.read(buffer, { cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (rawData.length === 0) {
    toast("Empty File", "The uploaded sheet contains no data rows.", "error");
    return [];
  }

  // Filter out trailing blank rows
  const nonEmptyRows = rawData.filter((r) => !isRowCompletelyEmpty(r));

  return nonEmptyRows.map((row, idx) => {
    const errors: string[] = [];

    // 1. Full Name (support single column or combination of first/last name)
    let fullName = extractVal(row, [
      "Employee Name",
      "Full Name",
      "Name",
      "Staff Name",
      "Employee",
      "English Name",
      "Latin Name",
      "fullname",
      "display_name",
      "user_name",
    ]);

    if (!fullName) {
      const firstName = extractVal(row, ["First Name", "FirstName", "first_name", "Given Name", "First"]);
      const lastName = extractVal(row, ["Last Name", "LastName", "last_name", "Family Name", "Surname", "Last"]);
      if (firstName || lastName) {
        fullName = `${firstName} ${lastName}`.trim();
      }
    }

    if (!fullName) {
      errors.push("Missing Full Name");
    }

    // 2. Khmer Name
    const khName = extractVal(row, ["Khmer Name", "KH Name", "Khmer", "Name in Khmer", "kh_name", "khmer_name", "ឈ្មោះខ្មែរ", "ឈ្មោះ"]);

    // 3. Gender
    const genderRaw = extractVal(row, ["Gender", "Sex", "Gender (Male/Female)", "gender", "sex", "ភេទ"]);
    const gender = normalizeGender(genderRaw);

    // 4. Title
    const title = extractVal(row, ["Title", "Prefix", "Salutation", "Title (Mr/Mrs/Ms)", "title"]) || "Mr";

    // 5. Contact Info
    const phone = extractVal(row, ["Phone", "Phone Number", "Telephone", "Mobile", "Contact", "phone_number", "phone", "tel", "លេខទូរស័ព្ទ"]);
    const email = extractVal(row, ["Email", "Email Address", "Mail", "E-mail", "email", "email_address", "សារអេឡិចត្រូនិច"]);

    // 6. Organization & Location
    const buName = extractVal(row, ["Branch / BU", "Business Unit / BU", "Business Unit", "BU", "Branch", "Company", "branch_id", "code_bu", "bu_full_name", "សាខា"]);
    const siteName = extractVal(row, ["Work Location", "Site / Work Location", "Site", "Location", "Office Location", "Branch Location", "site", "working_location", "ទីតាំង"]);
    const department = extractVal(row, ["Department", "Dept", "Department / Team", "Division", "department", "dept", "ផ្នែក"]) || "Operations";
    const position = extractVal(row, ["Position / Role", "Position", "Role", "Job Title", "Designation", "Job", "position", "role", "តួនាទី"]) || "Staff";
    const employmentType = extractVal(row, ["Employment Type", "Job Type", "Type", "Full Time/Part Time", "employment_type", "employee_type", "ប្រភេទការងារ"]) || "FULL-TIME";

    // 7. Joining & Contract
    const joinDateRaw = extractVal(row, ["Joining Date", "Joining Date (YYYY-MM-DD)", "Join Date", "Start Date", "Hire Date", "Date Joined", "join_date", "start_date", "ថ្ងៃចូលធ្វើការ"]);
    const joinDate = parseExcelDate(joinDateRaw) || new Date().toISOString().slice(0, 10);
    const contractType = extractVal(row, ["Contract Type", "Type of Contract", "Contract", "contract_type", "ប្រភេទកិច្ចសន្យា"]) || "PERMANENT (UDC)";

    // 8. Basic Salary
    const salaryRaw = extractVal(row, ["Basic Salary / Rate", "Basic Salary (USD)", "Basic Salary", "Salary", "Base Salary", "Rate", "Wage", "basic_salary", "contract_rate", "salary", "ប្រាក់បៀវត្ស"]);
    const basicSalary = parseSalary(salaryRaw);

    // 9. Personal Details
    const nationalId = extractVal(row, ["National ID", "ID Card", "ID Number", "Passport", "National ID / Passport", "national_id", "national_id_number", "អត្តសញ្ញាណប័ណ្ណ"]);
    const dobRaw = extractVal(row, ["Date of Birth (YYYY-MM-DD)", "Date of Birth", "DOB", "Birth Date", "Birthday", "date_of_birth", "dob", "ថ្ងៃខែឆ្នាំកំណើត"]);
    const dob = parseExcelDate(dobRaw);
    const currentAddress = extractVal(row, ["Current Address", "Address", "Location Address", "Residence", "current_address", "address", "អាសយដ្ឋាន"]);

    return {
      rowNumber: idx + 2,
      fullName,
      khName,
      gender,
      title,
      phone,
      email,
      buName,
      siteName,
      department,
      position,
      employmentType,
      joinDate,
      contractType,
      basicSalary,
      nationalId,
      dob,
      currentAddress,
      isValid: errors.length === 0,
      errors,
    };
  });
}
