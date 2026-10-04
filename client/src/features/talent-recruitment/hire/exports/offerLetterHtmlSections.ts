import type { OfferLetter } from "../types";
import { escapeHtml, formatCurrency } from "./offerLetterHtmlHelpers";

export function renderOfferPositionTable(params: {
  offer: OfferLetter;
  buName: string;
  formattedStartDate: string;
}): string {
  const { offer, buName, formattedStartDate } = params;
  return `
    <div class="section-title">I. Position Details</div>
    <table class="info-table">
      <tr>
        <td class="lbl">Position Title:</td>
        <td class="val-highlight">${escapeHtml(offer.job_title || "Designated Role")}</td>
        <td class="lbl">Business Unit:</td>
        <td>${escapeHtml(buName)}</td>
      </tr>
      <tr>
        <td class="lbl">Department / Division:</td>
        <td>${escapeHtml(offer.department || "General Operations")}${offer.division ? ` / ${escapeHtml(offer.division)}` : ""}</td>
        <td class="lbl">Reports Directly To:</td>
        <td style="font-weight: 600;">${escapeHtml(offer.reporting_to || "Department Manager")}</td>
      </tr>
      <tr>
        <td class="lbl">Employment Type:</td>
        <td>${escapeHtml(offer.employment_type || "Full-Time")}</td>
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
  `;
}

export function renderOfferCompensationTable(params: {
  offer: OfferLetter;
  baseSalary: number;
  totalPackage: number;
  probationMonths: number;
  allowances: any[];
  totalAllowances: number;
  isBasedOnQual: boolean;
}): string {
  const { offer, baseSalary, totalPackage, probationMonths, allowances, totalAllowances, isBasedOnQual } = params;
  const salaryHtml = isBasedOnQual
    ? baseSalary > 0
      ? `${formatCurrency(baseSalary)} <span style="font-size: 11px; font-weight: normal; color: #475569;">(Based on Qualification)</span>`
      : `Based on Qualification`
    : formatCurrency(baseSalary);

  const allowancesHtml = allowances.length > 0
    ? `<tr>
        <td class="lbl">Monthly Allowances:</td>
        <td colspan="3">
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            ${allowances.map((a) => `<span><strong>${escapeHtml(a.name)}:</strong> ${formatCurrency(a.amount)}</span>`).join("")}
            <span style="font-weight: 800; color: #253C7D; margin-left: auto;">Total Allowances: ${formatCurrency(totalAllowances)}</span>
          </div>
        </td>
      </tr>`
    : "";

  return `
    <div class="section-title">II. Remuneration &amp; Compensation Package</div>
    <table class="info-table">
      <tr>
        <td class="lbl">Gross Base Monthly Salary:</td>
        <td class="val-highlight" style="font-size: 13px; color: #0284c7;">${salaryHtml}</td>
        <td class="lbl">Probation Period:</td>
        <td style="font-weight: 600;">${probationMonths} Months ${offer.probation_salary ? `(${formatCurrency(offer.probation_salary)} during probation)` : ""}</td>
      </tr>
      ${allowancesHtml}
      <tr>
        <td class="lbl">Total Monthly Package:</td>
        <td colspan="3" style="font-size: 13px; font-weight: 900; color: #253C7D; background: #eef2ff;">${formatCurrency(totalPackage)} / month</td>
      </tr>
      <tr>
        <td class="lbl">Standard Benefits:</td>
        <td colspan="3">${escapeHtml(offer.benefits_summary || "Health & accident insurance coverage, 18 days annual paid leave, paid public holidays in accordance with Cambodia Labor Law, and annual performance evaluation.")}</td>
      </tr>
    </table>
  `;
}

export function renderOfferSignatures(params: {
  offer: OfferLetter;
  buName: string;
  formattedOfferDate: string;
  formattedStartDate: string;
}): string {
  const { offer, buName, formattedOfferDate, formattedStartDate } = params;
  const isAccepted = offer.status === "accepted" || offer.decision_at;

  const candidateSigHtml = isAccepted
    ? `
      <div style="margin-top: 6px; padding: 4px 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; color: #065f46; font-weight: 700; font-size: 10.5px;">
        ✓ Digitally Signed &amp; Accepted by Candidate
      </div>
      <div class="sig-date" style="margin-top: 4px;">Accepted on: ${escapeHtml(
        new Date(offer.decision_at || offer.updated_at || Date.now()).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        })
      )}</div>
      <div class="sig-date">Confirmed Start: ${escapeHtml(formattedStartDate)}</div>
    `
    : `
      <div class="sig-date">I accept the offer on the terms and conditions outlined above.</div>
      <div class="sig-date">Signature &amp; Date: _________________________</div>
    `;

  return `
    <div class="signatures-box">
      <div class="signatures-grid">
        <div class="sig-card">
          <div class="sig-title">AUTHORIZED EMPLOYER SIGNATURE</div>
          <div class="sig-line"></div>
          <div class="sig-name">${escapeHtml(offer.issued_by || offer.management_approved_by || "Head of Human Resources")}</div>
          <div class="sig-date">For &amp; on behalf of ${escapeHtml(buName)}</div>
          <div class="sig-date">Date: ${escapeHtml(formattedOfferDate)}</div>
        </div>
        <div class="sig-card">
          <div class="sig-title">CANDIDATE ACCEPTANCE ACKNOWLEDGMENT</div>
          <div class="sig-line"></div>
          <div class="sig-name">${escapeHtml(offer.candidate_name || "Candidate")}</div>
          ${candidateSigHtml}
        </div>
      </div>
    </div>
  `;
}
