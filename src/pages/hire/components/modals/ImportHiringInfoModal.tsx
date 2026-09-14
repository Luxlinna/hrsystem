import { memo, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Candidate } from "../../types";

interface ImportHiringInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ParsedHiringRow {
  rowNumber: number;
  id?: string;
  fullName: string;
  khName?: string;
  gender?: string;
  codeBu?: string;
  buFullName?: string;
  handleBu?: string;
  division?: string;
  department?: string;
  position?: string;
  workingHour?: string;
  totalWorkingDays?: string;
  employmentType?: string;
  startDate?: string;
  workingLocation?: string;
  nationalId?: string;
  dob?: string;
  currentAddress?: string;
  basicSalary?: number | null;
  taxMethod?: string;
  allowance?: string;
  lineManager?: string;
  contractType?: string;
  fdcEndDate?: string;
  site?: string;
  bankAccount?: string;
  nssf?: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyPhoneNumber?: string;
  status?: string;
  maritalStatus?: string;
  isValid: boolean;
  errors: string[];
}

const TEMPLATE_HEADERS = [
  "ID",
  "Full Name",
  "KH Name",
  "Gender",
  "Code BU",
  "BU Full Name",
  "Handle BU",
  "Division",
  "Department",
  "Position",
  "Working Hour",
  "Total Working day",
  "Full Time/Part Time",
  "Start Date",
  "Working Location",
  "National ID",
  "Date of Birth",
  "Current Address",
  "Basic Salary",
  "Tax Method",
  "Allowance",
  "Line Manager",
  "Type of Contract",
  "Date End of FDC",
  "Site",
  "Bank Account",
  "NSSF",
  "Email",
  "Phone Number",
  "Emergency Contact Name",
  "Emergency Phone Number",
  "Status(probation, intern)",
  "Marital Status",
];

export const ImportHiringInfoModal = memo(function ImportHiringInfoModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportHiringInfoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedHiringRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
      ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hiring Template");
      XLSX.writeFile(wb, "hiring_information_template.xlsx");
      toast("Template Ready", "Downloaded official 33-column Hiring Information template", "success");
    } catch (e) {
      console.error(e);
      toast("Download Failed", "Could not generate Excel template", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) parseFile(selected);
  };

  const parseFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const wb = await XLSX.read(buffer);
      const firstSheetName = wb.SheetNames[0];
      const worksheet = wb.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        toast("Empty File", "The uploaded sheet has no rows of data", "error");
        setParsedRows([]);
        return;
      }

      const rows: ParsedHiringRow[] = rawData.map((row, idx) => {
        const errors: string[] = [];

        // Flexible key matching (case-insensitive and trimmed)
        const getVal = (possibleKeys: string[]): string => {
          for (const pk of possibleKeys) {
            for (const rk of Object.keys(row)) {
              if (rk.trim().toLowerCase() === pk.trim().toLowerCase()) {
                return String(row[rk] ?? "").trim();
              }
            }
          }
          return "";
        };

        const fullName = getVal(["Full Name", "Name", "fullname", "Candidate Name"]);
        const email = getVal(["Email", "Email Address", "mail"]);
        const phone = getVal(["Phone Number", "Phone", "Mobile", "Contact"]);

        if (!fullName) errors.push("Missing Full Name");
        if (!email && !phone) errors.push("Requires Email or Phone");

        const basicSalaryRaw = getVal(["Basic Salary", "Salary", "base_salary"]);
        const basicSalary = basicSalaryRaw ? Number(basicSalaryRaw.replace(/[^0-9.]/g, "")) : null;

        const parseDate = (dStr: string): string | undefined => {
          if (!dStr) return undefined;
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
          return undefined;
        };

        return {
          rowNumber: idx + 2,
          id: getVal(["ID", "Candidate ID", "candidate_code"]),
          fullName,
          khName: getVal(["KH Name", "Khmer Name", "kh_name"]),
          gender: getVal(["Gender", "Sex"]),
          codeBu: getVal(["Code BU", "BU Code", "code_bu"]),
          buFullName: getVal(["BU Full Name", "Business Unit", "BU Name", "bu_full_name"]),
          handleBu: getVal(["Handle BU", "handle_bu"]),
          division: getVal(["Division", "division_name"]),
          department: getVal(["Department", "dept"]),
          position: getVal(["Position", "Job Title", "Role", "position_name"]),
          workingHour: getVal(["Working Hour", "Working Time", "working_hour"]),
          totalWorkingDays: getVal(["Total Working day", "Working Days", "total_working_days"]),
          employmentType: getVal(["Full Time/Part Time", "Employment Type", "type"]),
          startDate: parseDate(getVal(["Start Date", "Joining Date", "join_date"])),
          workingLocation: getVal(["Working Location", "Location", "Branch"]),
          nationalId: getVal(["National ID", "ID Card", "national_id"]),
          dob: parseDate(getVal(["Date of Birth", "DOB", "birth_date"])),
          currentAddress: getVal(["Current Address", "Address", "address"]),
          basicSalary: isNaN(Number(basicSalary)) ? null : basicSalary,
          taxMethod: getVal(["Tax Method", "tax_method"]),
          allowance: getVal(["Allowance", "Allowances"]),
          lineManager: getVal(["Line Manager", "Manager", "Reporting To"]),
          contractType: getVal(["Type of Contract", "Contract Type", "contract"]),
          fdcEndDate: parseDate(getVal(["Date End of FDC", "FDC End Date", "Contract End Date"])),
          site: getVal(["Site", "Project Site", "Workplace Site"]),
          bankAccount: getVal(["Bank Account", "Bank Details", "bank_account"]),
          nssf: getVal(["NSSF", "NSSF Number", "nssf_number"]),
          email,
          phone,
          emergencyContactName: getVal(["Emergency Contact Name", "Emergency Contact"]),
          emergencyPhoneNumber: getVal(["Emergency Phone Number", "Emergency Phone"]),
          status: getVal(["Status(probation, intern)", "Status", "Hiring Status"]),
          maritalStatus: getVal(["Marital Status", "marital_status"]),
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedRows(rows);
      toast("File Loaded", `Parsed ${rows.length} rows (${rows.filter((r) => r.isValid).length} valid)`, "success");
    } catch (err) {
      console.error(err);
      toast("Parse Error", "Failed to parse file. Please verify it is a valid Excel or CSV sheet.", "error");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) parseFile(dropped);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast("No Valid Rows", "None of the rows passed validation.", "error");
      return;
    }

    setImporting(true);
    try {
      // 1. Get current maximum candidate sequence to issue clean CAN-2026-XXXX codes
      const { data: latestCand } = await supabase
        .from("candidates")
        .select("candidate_code")
        .like("candidate_code", "CAN-2026-%")
        .order("candidate_code", { ascending: false })
        .limit(1);

      let seq = 1;
      if (latestCand && latestCand[0]?.candidate_code) {
        const match = latestCand[0].candidate_code.match(/CAN-2026-(\d+)/);
        if (match) seq = parseInt(match[1], 10) + 1;
      }

      // 2. Prepare candidate insert batch
      const inserts = validRows.map((r, i) => {
        const generatedCode = r.id && r.id.startsWith("CAN-") ? r.id : `CAN-2026-${String(seq + i).padStart(6, "0")}`;
        return {
          candidate_code: generatedCode,
          full_name: r.fullName,
          kh_name: r.khName || null,
          gender: r.gender || null,
          code_bu: r.codeBu || null,
          bu_full_name: r.buFullName || null,
          handle_bu: r.handleBu || null,
          division: r.division || null,
          department: r.department || null,
          position: r.position || null,
          working_hour: r.workingHour || null,
          total_working_days: r.totalWorkingDays || null,
          employment_type: r.employmentType || "Full-time",
          start_date: r.startDate || null,
          working_location: r.workingLocation || null,
          national_id_number: r.nationalId || null,
          date_of_birth: r.dob || null,
          current_address: r.currentAddress || null,
          basic_salary: r.basicSalary || null,
          expected_salary: r.basicSalary || null,
          tax_method: r.taxMethod || null,
          allowance: r.allowance || null,
          line_manager: r.lineManager || null,
          contract_type: r.contractType || null,
          fdc_end_date: r.fdcEndDate || null,
          site: r.site || null,
          bank_account_number: r.bankAccount || null,
          nssf_number: r.nssf || null,
          email: r.email || `candidate_${Date.now()}_${i}@internal.hr`,
          phone: r.phone || "",
          emergency_contact_name: r.emergencyContactName || null,
          emergency_phone_number: r.emergencyPhoneNumber || null,
          hiring_status: r.status || "Probation",
          marital_status: r.maritalStatus || null,
          stage: "applied",
          source: "Hiring Import",
          notes: `Imported via Hiring Information Master Roster on ${new Date().toLocaleDateString()}`,
          hiring_info: {
            imported_at: new Date().toISOString(),
            raw_row_number: r.rowNumber,
            site: r.site,
            code_bu: r.codeBu,
            handle_bu: r.handleBu,
            tax_method: r.taxMethod,
          },
        };
      });

      // Insert in chunks of 50
      for (let i = 0; i < inserts.length; i += 50) {
        const chunk = inserts.slice(i, i + 50);
        const { error } = await supabase.from("candidates").insert(chunk);
        if (error) throw error;
      }

      toast("Import Successful", `Successfully imported ${inserts.length} hiring records!`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast("Import Failed", err?.message || "Could not insert records into database", "error");
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/20 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Hiring Information Roster</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] font-bold">Upload & Batch Import</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <i className="ri-upload-cloud-2-line text-[#253C7D]" />
              Import Hiring Information
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Batch import complete hiring records with all 33 standardized fields directly into the recruitment pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#253C7D] text-[#253C7D] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Download Excel template with all 33 columns"
            >
              <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
              <span>Download Template (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#253C7D] bg-indigo-50/40 scale-[0.99]"
                : file
                ? "border-emerald-300 bg-emerald-50/20"
                : "border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center mx-auto mb-3 text-2xl text-[#253C7D]">
              <i className={file ? "ri-file-excel-line text-emerald-600" : "ri-upload-cloud-line"} />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-extrabold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-extrabold text-gray-800">
                  Drop your Excel or CSV spreadsheet here, or <span className="text-[#253C7D] underline">Browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports .xlsx, .xls, and .csv files formatted with the 33 standard hiring columns
                </p>
              </div>
            )}
          </div>

          {/* Validation & Preview Section */}
          {parsing && (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">Reading and validating spreadsheet data...</p>
            </div>
          )}

          {!parsing && parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-700">
                    Total Rows: <strong className="text-gray-900">{parsedRows.length}</strong>
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <i className="ri-checkbox-circle-fill text-emerald-600" />
                    Valid: <strong>{validCount}</strong>
                  </span>
                  {invalidCount > 0 && (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <i className="ri-error-warning-fill" />
                      Requires Attention: <strong>{invalidCount}</strong>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400">
                  Previewing all 33 mapped fields
                </span>
              </div>

              {/* Scrollable Preview Grid */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-gray-100/80 sticky top-0 z-10 text-gray-700 font-extrabold text-[10px] uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 whitespace-nowrap">Status</th>
                        <th className="p-2.5 whitespace-nowrap">Row #</th>
                        <th className="p-2.5 whitespace-nowrap">ID</th>
                        <th className="p-2.5 whitespace-nowrap">Full Name</th>
                        <th className="p-2.5 whitespace-nowrap">KH Name</th>
                        <th className="p-2.5 whitespace-nowrap">Gender</th>
                        <th className="p-2.5 whitespace-nowrap">Code BU</th>
                        <th className="p-2.5 whitespace-nowrap">BU Full Name</th>
                        <th className="p-2.5 whitespace-nowrap">Handle BU</th>
                        <th className="p-2.5 whitespace-nowrap">Division</th>
                        <th className="p-2.5 whitespace-nowrap">Department</th>
                        <th className="p-2.5 whitespace-nowrap">Position</th>
                        <th className="p-2.5 whitespace-nowrap">Working Hour</th>
                        <th className="p-2.5 whitespace-nowrap">Total Working Day</th>
                        <th className="p-2.5 whitespace-nowrap">Employment Type</th>
                        <th className="p-2.5 whitespace-nowrap">Start Date</th>
                        <th className="p-2.5 whitespace-nowrap">Working Location</th>
                        <th className="p-2.5 whitespace-nowrap">Site</th>
                        <th className="p-2.5 whitespace-nowrap">National ID</th>
                        <th className="p-2.5 whitespace-nowrap">Date of Birth</th>
                        <th className="p-2.5 whitespace-nowrap">Current Address</th>
                        <th className="p-2.5 whitespace-nowrap">Basic Salary</th>
                        <th className="p-2.5 whitespace-nowrap">Tax Method</th>
                        <th className="p-2.5 whitespace-nowrap">Allowance</th>
                        <th className="p-2.5 whitespace-nowrap">Line Manager</th>
                        <th className="p-2.5 whitespace-nowrap">Contract Type</th>
                        <th className="p-2.5 whitespace-nowrap">Date End of FDC</th>
                        <th className="p-2.5 whitespace-nowrap">Bank Account</th>
                        <th className="p-2.5 whitespace-nowrap">NSSF</th>
                        <th className="p-2.5 whitespace-nowrap">Email</th>
                        <th className="p-2.5 whitespace-nowrap">Phone</th>
                        <th className="p-2.5 whitespace-nowrap">Emergency Name</th>
                        <th className="p-2.5 whitespace-nowrap">Emergency Phone</th>
                        <th className="p-2.5 whitespace-nowrap">Status</th>
                        <th className="p-2.5 whitespace-nowrap">Marital Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {parsedRows.map((r) => (
                        <tr
                          key={r.rowNumber}
                          className={r.isValid ? "hover:bg-slate-50/60" : "bg-rose-50/30"}
                        >
                          <td className="p-2.5 whitespace-nowrap">
                            {r.isValid ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Ready
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                                title={r.errors.join(", ")}
                              >
                                {r.errors[0]}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-gray-400 font-mono">#{r.rowNumber}</td>
                          <td className="p-2.5 font-bold text-gray-700 whitespace-nowrap">{r.id || "Auto"}</td>
                          <td className="p-2.5 font-extrabold text-gray-900 whitespace-nowrap">{r.fullName}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.khName || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.gender || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-mono">{r.codeBu || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.buFullName || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.handleBu || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.division || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.department || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-semibold">{r.position || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.workingHour || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.totalWorkingDays || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.employmentType || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.startDate || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.workingLocation || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-semibold text-indigo-700">{r.site || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-mono">{r.nationalId || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.dob || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.currentAddress || "—"}</td>
                          <td className="p-2.5 text-gray-800 font-bold whitespace-nowrap">
                            {r.basicSalary != null ? `$${r.basicSalary}` : "—"}
                          </td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.taxMethod || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.allowance || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.lineManager || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.contractType || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.fdcEndDate || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-mono">{r.bankAccount || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap font-mono">{r.nssf || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.email || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.phone || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.emergencyContactName || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.emergencyPhoneNumber || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.status || "—"}</td>
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">{r.maritalStatus || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={importing || validCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing {validCount} Records...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-double-line text-sm" />
                  <span>Commit Import ({validCount} valid records)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
