import { memo } from "react";

interface ProposalNotesSectionProps {
  benefitsSummary: string;
  setBenefitsSummary: (v: string) => void;
  proposalNotes: string;
  setProposalNotes: (v: string) => void;
}

export const ProposalNotesSection = memo(function ProposalNotesSection({
  benefitsSummary,
  setBenefitsSummary,
  proposalNotes,
  setProposalNotes,
}: ProposalNotesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Benefits Summary */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">Standard Company Benefits</label>
        <textarea
          rows={2}
          value={benefitsSummary}
          onChange={(e) => setBenefitsSummary(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Proposal Rationale Notes */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Proposal Rationale &amp; Notes for Approver
        </label>
        <textarea
          rows={2}
          placeholder="Explain why this salary package is recommended (e.g. strong technical assessment, 5 years relevant experience)..."
          value={proposalNotes}
          onChange={(e) => setProposalNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Routing to HR Division Notice */}
      <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <i className="ri-send-plane-2-line text-blue-600 text-base shrink-0" />
          <div>
            <span className="font-bold text-blue-950">Next Step:</span>{" "}
            <span className="text-blue-900">
              This form will be sent across to the HR Division for review to generate the offer letter.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shrink-0">
          HR Division
        </span>
      </div>
    </div>
  );
});
