import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  WidthType,
  AlignmentType,
} from "docx";
import type { EmploymentContract } from "../types/contractTypes";
import { getOfficialCompanyNameEnglish } from "@/services/formLogoService";
import { formatContractDateTime } from "../constants/contractWorkflowConfig";
import { clean, cell, row, sectionHeader } from "./contractWordHelpers";
import { buildContractWordHeader } from "./buildContractWordHeader";

export async function exportContractWord(contract: EmploymentContract): Promise<boolean> {
  const companyEnglish = getOfficialCompanyNameEnglish();
  const headerTable = buildContractWordHeader();

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children: [
          headerTable,

          // Contract Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: "EMPLOYMENT CONTRACT",
                bold: true,
                font: "Calibri",
                size: 26,
                color: "0F172A",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Reference: ${contract.contract_number}  •  Linked Offer: ${clean(contract.offer_reference)}`,
                font: "Calibri",
                size: 19,
                color: "64748B",
              }),
            ],
          }),

          // Section 1: Contracting Parties
          sectionHeader("1. CONTRACTING PARTIES"),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: [
              row("The Employer:", `${companyEnglish} (HR Division, Corporate HQ)`),
              row("The Employee:", `${clean(contract.candidate_name)} (${clean(contract.candidate_email)})`),
            ],
          }),

          // Section 2: Position & Appointment Details
          sectionHeader("2. POSITION & APPOINTMENT DETAILS"),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: [
              row("Position Title:", clean(contract.position_title)),
              row("Department:", clean(contract.department)),
              row("Contract Commencement:", clean(contract.start_date)),
              row("Probationary Period:", `${contract.probation_months} Months from commencement`),
              row("Contract Classification:", clean(contract.contract_type).toUpperCase()),
            ],
          }),

          // Section 3: Remuneration & Employment Terms
          sectionHeader("3. REMUNERATION & EMPLOYMENT TERMS"),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: [
              row("Monthly Base Salary:", `$${contract.monthly_salary} ${clean(contract.currency)} / month (gross)`),
              row("Compliance Status:", "All pre-boarding compliance documents verified and authenticated."),
            ],
          }),

          // Section 4: Governance & Execution Signatories
          sectionHeader("4. STAKEHOLDER GOVERNANCE & EXECUTION AUDIT TRAIL"),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  cell(`STEP 1: CONTRACT DRAFT\nInitiator: ${clean(contract.created_by_name || "HR Recruiter")}\nAction: Drafted on ${formatContractDateTime(contract.created_at)}`, false, 5000),
                  cell(`STEP 2: HR DIVISION REVIEW\nReviewer: ${clean(contract.hr_reviewer_name || "HR Specialist")}\nAction: ${contract.hr_reviewed_at ? `Endorsed on ${formatContractDateTime(contract.hr_reviewed_at)}` : "Pending Review"}`, false, 5000),
                ],
              }),
              new TableRow({
                children: [
                  cell(`STEP 3: HR ADMIN DIRECTOR APPROVAL\nDirector: ${clean(contract.hr_director_name || "HR Admin Director")}\nAction: ${contract.hr_director_approved_at ? `Approved on ${formatContractDateTime(contract.hr_director_approved_at)}` : "Pending Approval"}`, false, 5000),
                  cell(`STEP 4: CHAIRWOMAN AUTHORIZATION\nExecutive: ${clean(contract.chairwoman_name || "Chairwoman")}\nAction: ${contract.chairwoman_approved_at ? `Authorized on ${formatContractDateTime(contract.chairwoman_approved_at)}` : "Pending Authorization"}`, false, 5000),
                ],
              }),
              new TableRow({
                children: [
                  cell(`STEP 5: CONTRACT ISSUANCE\nIssuer: ${clean(contract.issued_by_name || "HR Division")}\nAction: ${contract.issued_at ? `Issued on ${formatContractDateTime(contract.issued_at)}` : "Pending Issuance"}`, false, 5000),
                  cell(`STEP 6: EMPLOYEE ACCEPTANCE\nEmployee: ${clean(contract.candidate_name)}\nAction: ${contract.signed_at ? `Countersigned on ${formatContractDateTime(contract.signed_at)}` : "Awaiting Signature"}`, false, 5000),
                ],
              }),
            ],
          }),
          ...(contract.completed_at ? [
            new Paragraph({
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: `✓ Step 7: Completed & Archived into HR System on ${formatContractDateTime(contract.completed_at)}`,
                  bold: true,
                  font: "Calibri",
                  size: 19,
                  color: "059669",
                }),
              ],
            }),
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (contract.candidate_name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `Employment_Contract_${safeName}_${contract.contract_number}.docx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
  return true;
}
