import type { OfferLetter } from "../types";
import { resolveDocumentBranding } from "@/services/formLogoService";
import { escapeHtml, formatCurrency } from "./offerLetterHtmlHelpers";
import { offerLetterHtmlStyles } from "./offerLetterHtmlStyles";
import {
  renderOfferPositionTable,
  renderOfferCompensationTable,
  renderOfferSignatures,
} from "./offerLetterHtmlSections";

export { escapeHtml, formatCurrency };

export function generateOfferLetterHtml(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): string {
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

  const allowances = Array.isArray(offer.allowances) ? offer.allowances : [];
  const totalAllowances = allowances.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const baseSalary = Number(offer.base_salary || 0);
  const totalPackage = baseSalary + totalAllowances;
  const probationMonths = offer.probation_months ?? 3;
  const isBasedOnQual =
    (offer.special_terms || "").toLowerCase().includes("qualification") ||
    (offer.proposal_notes || "").toLowerCase().includes("qualification");

  const positionTableHtml = renderOfferPositionTable({ offer, buName, formattedStartDate });
  const compensationTableHtml = renderOfferCompensationTable({
    offer,
    baseSalary,
    totalPackage,
    probationMonths,
    allowances,
    totalAllowances,
    isBasedOnQual,
  });
  const signaturesHtml = renderOfferSignatures({ offer, buName, formattedOfferDate, formattedStartDate });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Formal Employment Offer — ${escapeHtml(offer.candidate_name)} (${escapeHtml(offer.job_title)})</title>
  <style>
    ${offerLetterHtmlStyles}
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
            <div class="header-top-row">
              <div class="header-logo-box">
                <img src="${buLogo}" alt="${escapeHtml(buName)}" class="header-logo-img" />
              </div>
              <div class="header-title-box">
                <h1 class="form-title">OFFICIAL OFFER OF EMPLOYMENT</h1>
              </div>
            </div>
            <div class="header-divider"></div>

            <div class="meta-row">
              <div><strong>Date:</strong> ${escapeHtml(formattedOfferDate)}</div>
              <div><strong>Offer Ref:</strong> <span class="ref-badge">${escapeHtml(offer.offer_number || "OFF-RECORD")}</span></div>
            </div>

            <div class="salutation-box">
              <div><strong>To: ${escapeHtml(offer.candidate_name || "Candidate")}</strong></div>
              ${offer.candidate_email ? `<div>Email: ${escapeHtml(offer.candidate_email)} &middot; Phone: ${escapeHtml(offer.candidate_phone || "—")}</div>` : ""}
              <p style="margin-top: 6px; margin-bottom: 0;">
                On behalf of <strong>${escapeHtml(buName)}</strong>, we are delighted to formally offer you the position of 
                <strong style="color: #253C7D;">${escapeHtml(offer.job_title || "Designated Role")}</strong>. We were thoroughly impressed with your professional background, qualifications, and interview assessments, and we believe you will make a valuable contribution to our team.
              </p>
            </div>

            ${positionTableHtml}
            ${compensationTableHtml}

            <div class="section-title">III. General Terms &amp; Conditions</div>
            <div class="terms-box">
              <p><strong>1. Probationary Period:</strong> Your employment is subject to a satisfactory probationary period of ${probationMonths} months. Prior to the end of this period, a performance appraisal will be conducted to confirm your ongoing employment status.</p>
              <p><strong>2. Compliance &amp; Confidentiality:</strong> You will be required to adhere to all company policies, employee code of conduct, and maintain strict confidentiality regarding all proprietary information, client data, and business operations.</p>
              <p><strong>3. Pre-Employment Requirements:</strong> This offer is conditional upon satisfactory submission of your national identification, verified educational credentials, and relevant reference checks prior to your start date.</p>
              <p><strong>4. Offer Validity:</strong> Please signify your acceptance of this offer by signing and returning this document no later than <strong>${escapeHtml(formattedExpiryDate)}</strong>.</p>
            </div>

            ${signaturesHtml}

            <div class="footer-bar">
              <div>HRM_OPS Enterprise HRMS &middot; ${escapeHtml(buName)}</div>
              <div>Confidential Employment Offer &middot; Ref: ${escapeHtml(offer.offer_number || "OFF-RECORD")} &middot; Page 1 of 1</div>
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
