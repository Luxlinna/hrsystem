import type { Candidate } from "../../types";
import { getOfficialFormLogo, getOfficialCompanyNameEnglish } from "@/services/formLogoService";

const v = (val?: string | number | null) => (val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "—");

export function buildHiringInfoPdfHtml(candidate: Candidate): string {
  const logo = getOfficialFormLogo();
  const compName = getOfficialCompanyNameEnglish();
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hiring Information - ${candidate.full_name || "Candidate"}</title>
  <style>
    @page { size: A4 portrait; margin: 0 !important; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    html, body { margin: 0 !important; padding: 0; background: #fff; }
    body { padding: 12mm 14mm !important; color: #0f172a; font-size: 9.5pt; line-height: 1.35; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #253c7d; padding-bottom: 8px; margin-bottom: 12px; }
    .logo { max-height: 46px; max-width: 170px; object-fit: contain; }
    .title-box { text-align: right; }
    .title-box h1 { font-size: 13pt; color: #253c7d; font-weight: 800; letter-spacing: -0.2px; text-transform: uppercase; }
    .title-box p { font-size: 8pt; color: #64748b; margin-top: 2px; }
    .hero-strip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .sec-title { font-size: 9pt; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 3px 8px; border-left: 3px solid #253c7d; margin: 8px 0 4px; text-transform: uppercase; letter-spacing: 0.3px; }
    table.data-tbl { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    table.data-tbl td { border: 1px solid #e2e8f0; padding: 3.5px 7px; vertical-align: top; font-size: 8.5pt; }
    table.data-tbl td.lbl { width: 18%; background: #fafafa; color: #475569; font-weight: 600; }
    table.data-tbl td.val { width: 32%; color: #0f172a; font-weight: 500; word-break: break-word; }
    .sig-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; }
    .sig-box { text-align: center; border-top: 1px solid #94a3b8; padding-top: 4px; margin-top: 36px; font-size: 8pt; color: #475569; font-weight: 600; }
    @media print {
      @page { size: A4 portrait; margin: 0 !important; }
      html, body { margin: 0 !important; padding: 12mm 14mm !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logo}" class="logo" alt="Company Logo" />
    <div class="title-box">
      <h1>Hiring &amp; Employment Master Record</h1>
      <p>${compName} &middot; Generated: ${dateStr}</p>
    </div>
  </div>

  <div class="hero-strip">
    <div>
      <span style="font-size: 11pt; font-weight: 800; color: #0f172a;">${v(candidate.full_name)}</span>
      ${candidate.kh_name ? `<span style="color:#64748b; margin-left:6px; font-weight:600;">(${candidate.kh_name})</span>` : ""}
    </div>
    <div style="font-family: monospace; font-weight: 700; color: #253c7d; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt;">
      ID: ${v(candidate.candidate_code || candidate.id?.slice(0, 8))}
    </div>
  </div>

  <div class="sec-title">1. Employee Identity &amp; Personal Details</div>
  <table class="data-tbl">
    <tr>
      <td class="lbl">Candidate ID</td><td class="val">${v(candidate.candidate_code)}</td>
      <td class="lbl">Full Name</td><td class="val">${v(candidate.full_name)}</td>
    </tr>
    <tr>
      <td class="lbl">KH Name</td><td class="val">${v(candidate.kh_name)}</td>
      <td class="lbl">Gender</td><td class="val">${v(candidate.gender)}</td>
    </tr>
    <tr>
      <td class="lbl">National ID</td><td class="val">${v(candidate.national_id_number)}</td>
      <td class="lbl">Date of Birth</td><td class="val">${v(candidate.date_of_birth)}</td>
    </tr>
    <tr>
      <td class="lbl">Marital Status</td><td class="val">${v(candidate.marital_status)}</td>
      <td class="lbl">Current Address</td><td class="val">${v(candidate.current_address)}</td>
    </tr>
  </table>

  <div class="sec-title">2. Business Unit &amp; Organizational Placement</div>
  <table class="data-tbl">
    <tr>
      <td class="lbl">Code BU</td><td class="val">${v(candidate.code_bu)}</td>
      <td class="lbl">BU Full Name</td><td class="val">${v(candidate.bu_full_name)}</td>
    </tr>
    <tr>
      <td class="lbl">Handle BU</td><td class="val">${v(candidate.handle_bu)}</td>
      <td class="lbl">Division</td><td class="val">${v(candidate.division)}</td>
    </tr>
    <tr>
      <td class="lbl">Department</td><td class="val">${v(candidate.department)}</td>
      <td class="lbl">Position</td><td class="val">${v(candidate.position)}</td>
    </tr>
    <tr>
      <td class="lbl">Working Location</td><td class="val">${v(candidate.working_location)}</td>
      <td class="lbl">Site</td><td class="val">${v(candidate.site)}</td>
    </tr>
    <tr>
      <td class="lbl">Line Manager</td><td class="val" colspan="3">${v(candidate.line_manager)}</td>
    </tr>
  </table>

  <div class="sec-title">3. Working Terms &amp; Schedule</div>
  <table class="data-tbl">
    <tr>
      <td class="lbl">Working Hours</td><td class="val">${v(candidate.working_hour)}</td>
      <td class="lbl">Total Working Days</td><td class="val">${v(candidate.total_working_days)}</td>
    </tr>
    <tr>
      <td class="lbl">Full/Part Time</td><td class="val">${v(candidate.employment_type)}</td>
      <td class="lbl">Start Date</td><td class="val">${v(candidate.start_date)}</td>
    </tr>
    <tr>
      <td class="lbl">Contract Type</td><td class="val">${v(candidate.contract_type)}</td>
      <td class="lbl">Date End of FDC</td><td class="val">${v(candidate.fdc_end_date)}</td>
    </tr>
    <tr>
      <td class="lbl">Status</td><td class="val" colspan="3">${v(candidate.hiring_status)}</td>
    </tr>
  </table>

  <div class="sec-title">4. Compensation &amp; Banking Details</div>
  <table class="data-tbl">
    <tr>
      <td class="lbl">Basic Salary</td><td class="val">${candidate.basic_salary ? `$${candidate.basic_salary}` : "—"}</td>
      <td class="lbl">Tax Method</td><td class="val">${v(candidate.tax_method)}</td>
    </tr>
    <tr>
      <td class="lbl">Allowance</td><td class="val">${candidate.allowance ? `$${candidate.allowance}` : "—"}</td>
      <td class="lbl">Bank Account</td><td class="val">${v(candidate.bank_account_number)}</td>
    </tr>
    <tr>
      <td class="lbl">NSSF Number</td><td class="val" colspan="3">${v(candidate.nssf_number)}</td>
    </tr>
  </table>

  <div class="sec-title">5. Contact &amp; Emergency Contact</div>
  <table class="data-tbl">
    <tr>
      <td class="lbl">Email</td><td class="val">${v(candidate.email)}</td>
      <td class="lbl">Phone Number</td><td class="val">${v(candidate.phone)}</td>
    </tr>
    <tr>
      <td class="lbl">Emergency Contact</td><td class="val">${v(candidate.emergency_contact_name)}</td>
      <td class="lbl">Emergency Phone</td><td class="val">${v(candidate.emergency_phone_number)}</td>
    </tr>
  </table>

  <div class="sig-row">
    <div><div class="sig-box">Prepared by HR Operations<br/>Date: ______________</div></div>
    <div><div class="sig-box">Verified by Line Manager<br/>Date: ______________</div></div>
    <div><div class="sig-box">Approved by BU Head / GM<br/>Date: ______________</div></div>
  </div>
</body>
</html>`;
}
