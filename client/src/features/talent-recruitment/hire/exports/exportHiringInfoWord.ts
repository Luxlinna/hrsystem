import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel } from "docx";
import type { Candidate } from "../types";
import { getOfficialCompanyNameEnglish } from "@/services/formLogoService";
import { toast } from "@/components/Toast";

const v = (val?: string | number | null) => (val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "—");

function createCell(text: string, isLabel = false, widthPct = 25): TableCell {
  return new TableCell({
    width: { size: widthPct * 50, type: WidthType.DXA },
    shading: isLabel ? { fill: "F1F5F9" } : undefined,
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isLabel,
            font: "Calibri",
            size: 19, // ~9.5pt
            color: isLabel ? "334155" : "0F172A",
          }),
        ],
      }),
    ],
  });
}

function makeRow(l1: string, v1: string, l2 = "", v2 = ""): TableRow {
  return new TableRow({
    children: [
      createCell(l1, true, 20),
      createCell(v1, false, 30),
      createCell(l2, true, 20),
      createCell(v2, false, 30),
    ],
  });
}

function sectionTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: title, bold: true, font: "Calibri", size: 22, color: "1E3A8A" }),
    ],
  });
}

export async function exportHiringInfoWord(candidate: Candidate): Promise<boolean> {
  if (!candidate) {
    toast("Export Failed", "Candidate record not found", "error");
    return false;
  }

  const comp = getOfficialCompanyNameEnglish();
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const tblIdentity = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      makeRow("Candidate ID", v(candidate.candidate_code), "Full Name", v(candidate.full_name)),
      makeRow("KH Name", v(candidate.kh_name), "Gender", v(candidate.gender)),
      makeRow("National ID", v(candidate.national_id_number), "Date of Birth", v(candidate.date_of_birth)),
      makeRow("Marital Status", v(candidate.marital_status), "Current Address", v(candidate.current_address)),
    ],
  });

  const tblOrg = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      makeRow("Code BU", v(candidate.code_bu), "BU Full Name", v(candidate.bu_full_name)),
      makeRow("Handle BU", v(candidate.handle_bu), "Division", v(candidate.division)),
      makeRow("Department", v(candidate.department), "Position", v(candidate.position)),
      makeRow("Working Location", v(candidate.working_location), "Site", v(candidate.site)),
      makeRow("Line Manager", v(candidate.line_manager), "", ""),
    ],
  });

  const tblTerms = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      makeRow("Working Hours", v(candidate.working_hour), "Total Working Days", v(candidate.total_working_days)),
      makeRow("Full/Part Time", v(candidate.employment_type), "Start Date", v(candidate.start_date)),
      makeRow("Contract Type", v(candidate.contract_type), "Date End of FDC", v(candidate.fdc_end_date)),
      makeRow("Status", v(candidate.hiring_status), "", ""),
    ],
  });

  const tblPay = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      makeRow("Basic Salary", candidate.basic_salary ? `$${candidate.basic_salary}` : "—", "Tax Method", v(candidate.tax_method)),
      makeRow("Allowance", candidate.allowance ? `$${candidate.allowance}` : "—", "Bank Account", v(candidate.bank_account_number)),
      makeRow("NSSF Number", v(candidate.nssf_number), "", ""),
    ],
  });

  const tblContact = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      makeRow("Email", v(candidate.email), "Phone Number", v(candidate.phone)),
      makeRow("Emergency Name", v(candidate.emergency_contact_name), "Emergency Phone", v(candidate.emergency_phone_number)),
    ],
  });

  const tblSig = new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          createCell("Prepared by HR Operations\n\n__________________\nDate: ___________", false, 33),
          createCell("Verified by Line Manager\n\n__________________\nDate: ___________", false, 33),
          createCell("Approved by BU Head / GM\n\n__________________\nDate: ___________", false, 34),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "HIRING & EMPLOYMENT MASTER RECORD", bold: true, size: 28, color: "1E3A8A" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({ text: `${comp}  |  Generated: ${dateStr}`, color: "64748B", size: 18 }),
            ],
          }),
          sectionTitle("1. Employee Identity & Personal Details"),
          tblIdentity,
          sectionTitle("2. Business Unit & Organizational Placement"),
          tblOrg,
          sectionTitle("3. Working Terms & Schedule"),
          tblTerms,
          sectionTitle("4. Compensation & Banking Details"),
          tblPay,
          sectionTitle("5. Contact & Emergency Contacts"),
          tblContact,
          new Paragraph({ spacing: { before: 240, after: 80 } }),
          tblSig,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (candidate.full_name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `Hiring_Info_${safeName}_${candidate.candidate_code || "Record"}.docx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);

  toast("Word Document Exported", "Downloaded .docx record.", "success");
  return true;
}
