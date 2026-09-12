import type { OfferLetter } from "../types";
import { resolveDocumentBranding } from "@/services/formLogoService";

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(val?: number | null): string {
  if (val === null || val === undefined) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

export function generateOfferLetterHtml(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): string {
  // When exported at HR Division: MUST WORK WITH UNI LOGO (NO OPS), even if employee or form request was from OPS
  const { logo: buLogo, companyName: defaultBuName, isHrDivision } = resolveDocumentBranding({
    businessUnit: offer.business_unit,
    department: offer.department,
    division: offer.division,
    customLogo: buLogoCustom,
    isHrDivisionContext,
  });
  const buName = isHrDivision ? defaultBuName : (offer.business_unit || defaultBuName);

  const formattedOfferDate = offer.issued_at
    ? new Date(offer.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const formattedStartDate = offer.target_start_date
    ? new Date(offer.target_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "To be confirmed";

  const formattedExpiryDate = offer.expiry_date
    ? new Date(offer.expiry_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "7 days from issuance";

  const totalAllowances = (offer.allowances || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;
  const isBasedOnQual =
    (offer.special_terms || "").toLowerCase().includes("qualification") ||
    (offer.proposal_notes || "").toLowerCase().includes("qualification");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Formal Employment Offer — ${escapeHtml(offer.candidate_name)} (${escapeHtml(offer.job_title)})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.5;
    }
    table.print-page-layout {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      padding: 0;
    }
    table.print-page-layout > thead {
      display: table-header-group;
    }
    table.print-page-layout > tfoot {
      display: table-footer-group;
    }
    table.print-page-layout > thead > tr > td,
    table.print-page-layout > tfoot > tr > td,
    table.print-page-layout > tbody > tr > td {
      border: none;
      padding: 0;
      margin: 0;
    }
    .page-header-spacer {
      height: 8mm;
    }
    .page-footer-spacer {
      height: 8mm;
    }
    .page-container {
      width: 100%;
      padding: 0 16mm;
      box-sizing: border-box;
    }
    .header-top-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      gap: 16px;
    }
    .header-logo-box {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }
    .header-logo-img {
      max-height: 85px;
      max-width: 300px;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .header-title-box {
      flex: 1 1 auto;
      text-align: right;
    }
    .form-title {
      font-size: 20px;
      font-weight: 900;
      color: #253C7D;
      margin: 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .header-divider {
      height: 2.5px;
      background-color: #253C7D;
      width: 100%;
      margin: 6px 0 14px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 11px;
      color: #475569;
    }
    .ref-badge {
      font-family: monospace;
      font-size: 11.5px;
      font-weight: 800;
      background: #eef2ff;
      color: #253C7D;
      border: 1px solid #c7d2fe;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .salutation-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #253C7D;
      padding: 7px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 11px;
      line-height: 1.5;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #253C7D;
      margin: 10px 0 4px 0;
      letter-spacing: 0.2px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #253C7D;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .info-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      font-size: 11px;
      vertical-align: middle;
      color: #0f172a;
    }
    .info-table .lbl {
      font-weight: 700;
      width: 28%;
      background-color: #f1f5f9;
      color: #1e293b;
    }
    .info-table .val-highlight {
      font-weight: 800;
      color: #253C7D;
    }
    .terms-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 12px;
      background: #ffffff;
      margin-bottom: 10px;
      font-size: 10.5px;
      line-height: 1.5;
      color: #334155;
    }
    .terms-box p {
      margin: 0 0 4px 0;
    }
    .terms-box ul {
      margin: 0 0 6px 0;
      padding-left: 20px;
    }
    .terms-box li {
      margin-bottom: 2px;
    }
    .signatures-box {
      margin-top: 12px;
      page-break-inside: avoid;
    }
    .signatures-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .sig-card {
      width: 48%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 800;
      color: #253C7D;
      margin-bottom: 26px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .sig-line {
      border-bottom: 1.5px solid #475569;
      margin-bottom: 5px;
    }
    .sig-name {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-date {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .footer-bar {
      margin-top: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <table class="print-page-layout">
    <thead>
      <tr><td><div class="page-header-spacer"></div></td></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="page-container">
            <!-- Header -->
            <div class="header-top-row">
              <div class="header-logo-box">
                <img src="${buLogo}" alt="${escapeHtml(buName)}" class="header-logo-img" />
              </div>
              <div class="header-title-box">
                <h1 class="form-title">OFFICIAL OFFER OF EMPLOYMENT</h1>
              </div>
            </div>
            <div class="header-divider"></div>

            <!-- Meta row -->
            <div class="meta-row">
              <div><strong>Date:</strong> ${escapeHtml(formattedOfferDate)}</div>
              <div><strong>Offer Ref:</strong> <span class="ref-badge">${escapeHtml(offer.offer_number)}</span></div>
            </div>

            <!-- Salutation -->
            <div class="salutation-box">
              <div><strong>To: ${escapeHtml(offer.candidate_name)}</strong></div>
              ${offer.candidate_email ? `<div>Email: ${escapeHtml(offer.candidate_email)} &middot; Phone: ${escapeHtml(offer.candidate_phone || "—")}</div>` : ""}
              <p style="margin-top: 6px; margin-bottom: 0;">
                On behalf of <strong>${escapeHtml(buName)}</strong>, we are delighted to formally offer you the position of 
                <strong style="color: #253C7D;">${escapeHtml(offer.job_title)}</strong>. We were thoroughly impressed with your professional background, qualifications, and interview assessments, and we believe you will make a valuable contribution to our team.
              </p>
            </div>

            <!-- Position Information -->
            <div class="section-title">I. Position Details</div>
            <table class="info-table">
              <tr>
                <td class="lbl">Position Title:</td>
                <td class="val-highlight">${escapeHtml(offer.job_title)}</td>
                <td class="lbl">Business Unit:</td>
                <td>${escapeHtml(buName)}</td>
              </tr>
              <tr>
                <td class="lbl">Department / Division:</td>
                <td>${escapeHtml(offer.department)}${offer.division ? ` / ${escapeHtml(offer.division)}` : ""}</td>
                <td class="lbl">Reports Directly To:</td>
                <td style="font-weight: 600;">${escapeHtml(offer.reporting_to || "Department Manager")}</td>
              </tr>
              <tr>
                <td class="lbl">Employment Type:</td>
                <td>${escapeHtml(offer.employment_type)}</td>
                <td class="lbl">Commencement Date:</td>
                <td style="font-weight: 700; color: #059669;">${escapeHtml(formattedStartDate)}</td>
              </tr>
              <tr>
                <td class="lbl">Working Schedule:</td>
                <td>${escapeHtml(offer.working_days || "Monday to Saturday Half")}</td>
                <td class="lbl">Working Hours:</td>
                <td>${escapeHtml(offer.working_time || "8:00 am – 5:00 pm")}</td>
              </tr>
            </table>

            <!-- Compensation Package -->
            <div class="section-title">II. Remuneration &amp; Compensation Package</div>
            <table class="info-table">
              <tr>
                <td class="lbl">Gross Base Monthly Salary:</td>
                <td class="val-highlight" style="font-size: 13px; color: #0284c7;">
                  ${
                    isBasedOnQual
                      ? offer.base_salary > 0
                        ? `${formatCurrency(offer.base_salary)} <span style="font-size: 11px; font-weight: normal; color: #475569;">(Based on Qualification)</span>`
                        : `Based on Qualification`
                      : formatCurrency(offer.base_salary)
                  }
                </td>
                <td class="lbl">Probation Period:</td>
                <td style="font-weight: 600;">
                  ${offer.probation_months} Months 
                  ${offer.probation_salary ? `(${formatCurrency(offer.probation_salary)} during probation)` : ""}
                </td>
              </tr>
              ${
                offer.allowances && offer.allowances.length > 0
                  ? `<tr>
                      <td class="lbl">Monthly Allowances:</td>
                      <td colspan="3">
                        <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                          ${offer.allowances
                            .map((a) => `<span><strong>${escapeHtml(a.name)}:</strong> ${formatCurrency(a.amount)}</span>`)
                            .join("")}
                          <span style="font-weight: 800; color: #253C7D; margin-left: auto;">Total Allowances: ${formatCurrency(totalAllowances)}</span>
                        </div>
                      </td>
                    </tr>`
                  : ""
              }
              <tr>
                <td class="lbl">Total Monthly Package:</td>
                <td colspan="3" style="font-size: 13px; font-weight: 900; color: #253C7D; background: #eef2ff;">
                  ${formatCurrency(totalPackage)} / month
                </td>
              </tr>
              <tr>
                <td class="lbl">Standard Benefits:</td>
                <td colspan="3">
                  ${escapeHtml(offer.benefits_summary || "Health & accident insurance coverage, 18 days annual paid leave, paid public holidays in accordance with Cambodia Labor Law, and annual performance evaluation.")}
                </td>
              </tr>
            </table>

            <!-- Employment Terms -->
            <div class="section-title">III. General Terms &amp; Conditions</div>
            <div class="terms-box">
              <p><strong>1. Probationary Period:</strong> Your employment is subject to a satisfactory probationary period of ${offer.probation_months} months. Prior to the end of this period, a performance appraisal will be conducted to confirm your ongoing employment status.</p>
              <p><strong>2. Compliance &amp; Confidentiality:</strong> You will be required to adhere to all company policies, employee code of conduct, and maintain strict confidentiality regarding all proprietary information, client data, and business operations.</p>
              <p><strong>3. Pre-Employment Requirements:</strong> This offer is conditional upon satisfactory submission of your national identification, verified educational credentials, and relevant reference checks prior to your start date.</p>
              <p><strong>4. Offer Validity:</strong> Please signify your acceptance of this offer by signing and returning this document no later than <strong>${escapeHtml(formattedExpiryDate)}</strong>.</p>
            </div>

            <!-- Signatures Section -->
            <div class="signatures-box">
              <div class="signatures-grid">
                <!-- Company Signatory -->
                <div class="sig-card">
                  <div class="sig-title">AUTHORIZED EMPLOYER SIGNATURE</div>
                  <div class="sig-line"></div>
                  <div class="sig-name">${escapeHtml(offer.issued_by || offer.management_approved_by || "Head of Human Resources")}</div>
                  <div class="sig-date">For &amp; on behalf of ${escapeHtml(buName)}</div>
                  <div class="sig-date">Date: ${escapeHtml(formattedOfferDate)}</div>
                </div>

                <!-- Candidate Acceptance -->
                <div class="sig-card">
                  <div class="sig-title">CANDIDATE ACCEPTANCE ACKNOWLEDGMENT</div>
                  <div class="sig-line"></div>
                  <div class="sig-name">${escapeHtml(offer.candidate_name)}</div>
                  ${
                    offer.status === "accepted" || offer.decision_at
                      ? `
                    <div style="margin-top: 6px; padding: 4px 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; color: #065f46; font-weight: 700; font-size: 10.5px;">
                      ✓ Digitally Signed &amp; Accepted by Candidate
                    </div>
                    <div class="sig-date" style="margin-top: 4px;">Accepted on: ${escapeHtml(
                      new Date(offer.decision_at || offer.updated_at || Date.now()).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    )}</div>
                    <div class="sig-date">Confirmed Start: ${escapeHtml(formattedStartDate)}</div>
                  `
                      : `
                    <div class="sig-date">I accept the offer on the terms and conditions outlined above.</div>
                    <div class="sig-date">Signature &amp; Date: _________________________</div>
                  `
                  }
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer-bar">
              <div>HRM_OPS Enterprise HRMS &middot; ${escapeHtml(buName)}</div>
              <div>Confidential Employment Offer &middot; Ref: ${escapeHtml(offer.offer_number)} &middot; Page 1 of 1</div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td><div class="page-footer-spacer"></div></td></tr>
    </tfoot>
  </table>
</body>
</html>`;
}

export function exportOfferLetterPdf(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): boolean {
  const html = generateOfferLetterHtml(offer, buLogoCustom, isHrDivisionContext);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback if print blocked
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 350);

      return true;
    }
  } catch {
    // Fallback if iframe creation fails
  }

  // Fallback to window.open
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
    return true;
  }

  return false;
}

export function previewOfferLetterHtml(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): boolean {
  const baseHtml = generateOfferLetterHtml(offer, buLogoCustom, isHrDivisionContext);

  const banner = `
    <div class="no-print" style="position: sticky; top: 0; z-index: 99999; background: #1e293b; color: #ffffff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 800; font-size: 13.5px; color: #f8fafc; letter-spacing: -0.01em;">
          Formal Offer &amp; Acceptance Record — ${escapeHtml(offer.offer_number)}
        </span>
        <span style="background: #059669; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          ${escapeHtml(offer.status)}
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button onclick="window.print()" style="background: #2563eb; hover:background: #1d4ed8; color: white; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          <span>🖨️ Print / Save as PDF</span>
        </button>
        <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 7px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">
          <span>✕ Close Tab</span>
        </button>
      </div>
    </div>
  `;

  // Insert banner right after <body>
  const previewHtml = baseHtml.replace("<body>", `<body>${banner}`);

  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.open();
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();
    previewWindow.focus();
    return true;
  }
  return false;
}
