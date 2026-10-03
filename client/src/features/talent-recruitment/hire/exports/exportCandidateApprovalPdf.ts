import type { CandidateApproval } from "../types";
import { buildCandidateApprovalHtml } from "./templates/candidateApprovalPdfTemplate";

export function exportCandidateApprovalPdf(approval: CandidateApproval, isHrDivisionContext?: boolean) {
  if (!approval) return;
  try {
    const htmlContent = buildCandidateApprovalHtml(approval, isHrDivisionContext);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  } catch (err) {
    console.warn("Could not export Candidate Approval PDF:", err);
  }
}
