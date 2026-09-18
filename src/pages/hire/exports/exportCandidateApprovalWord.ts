import { Document, Packer } from "docx";
import type { CandidateApproval } from "../types";
import {
  buildCandidateApprovalHeaderTable,
  buildCandidateApprovalTitleTable,
} from "./candidate-approval-word/buildCandidateApprovalHeader";
import { buildCandidateOverviewSection } from "./candidate-approval-word/buildCandidateOverviewTable";
import { buildCandidateEvaluationSection } from "./candidate-approval-word/buildCandidateEvaluationTable";
import { buildInterviewPanelsSection } from "./candidate-approval-word/buildInterviewPanelsTable";
import { buildCandidateSignatoriesSection } from "./candidate-approval-word/buildCandidateSignatoriesTable";

export async function exportCandidateApprovalWord(
  approval: CandidateApproval,
  isHrDivisionContext?: boolean
): Promise<boolean> {
  const headerTable = buildCandidateApprovalHeaderTable(approval, isHrDivisionContext);
  const titleTable = buildCandidateApprovalTitleTable(approval);
  const overviewSection = buildCandidateOverviewSection(approval);
  const evaluationSection = buildCandidateEvaluationSection(approval);
  const panelsSection = buildInterviewPanelsSection(approval);
  const signatoriesSection = buildCandidateSignatoriesSection(approval);

  // Construct Document with 10mm margins on A4 (567 dxa)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 567,
              right: 567,
              bottom: 567,
              left: 567,
            },
          },
        },
        children: [
          headerTable,
          titleTable,
          ...overviewSection,
          ...evaluationSection,
          ...panelsSection,
          ...signatoriesSection,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${approval.form_number || "CAF"}_Candidate_Approval.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}
