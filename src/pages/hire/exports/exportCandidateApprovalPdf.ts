import type { CandidateApproval } from "../types";
import { buildCandidateApprovalHtml } from "./templates/candidateApprovalPdfTemplate";

export function exportCandidateApprovalPdf(approval: CandidateApproval) {
  const printWindow = document.createElement("iframe");
  printWindow.style.position = "fixed";
  printWindow.style.right = "0";
  printWindow.style.bottom = "0";
  printWindow.style.width = "0";
  printWindow.style.height = "0";
  printWindow.style.border = "0";
  document.body.appendChild(printWindow);

  const doc = printWindow.contentWindow?.document;
  if (!doc) return;

  const htmlContent = buildCandidateApprovalHtml(approval);

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      document.body.removeChild(printWindow);
    } catch {
      // Ignored
    }
  }, 10000);
}
