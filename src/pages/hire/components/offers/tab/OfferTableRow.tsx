import { memo } from "react";
import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";
import { STATUS_CONFIG } from "./offerStatusConfig";
import { OfferTableRowActions } from "./OfferTableRowActions";

interface OfferTableRowProps {
  offer: OfferLetter;
  isCurrentScopeHr: boolean;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onExportWord?: (offer: OfferLetter) => void;
  onExportPdf: (offer: OfferLetter) => void;
  onDeleteOffer: (offer: OfferLetter) => void;
}

export const OfferTableRow = memo(function OfferTableRow({
  offer,
  isCurrentScopeHr,
  onOpenWorkflowModal,
  onExportWord,
  onExportPdf,
  onDeleteOffer,
}: OfferTableRowProps) {
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.salary_proposal;
  const totalAllowances = (offer.allowances || []).reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;
  const isBasedOnQual =
    (offer.special_terms || "").toLowerCase().includes("qualification") ||
    (offer.proposal_notes || "").toLowerCase().includes("qualification");

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Ref */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="font-mono font-bold text-xs text-[#253C7D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {offer.offer_number}
        </span>
        <span className="block text-[10px] text-slate-400 mt-1">
          {new Date(offer.created_at).toLocaleDateString()}
        </span>
      </td>

      {/* Candidate & Role */}
      <td className="py-3.5 px-4">
        <span className="font-bold text-slate-900 block text-sm">{offer.candidate_name}</span>
        <span className="text-xs text-blue-700 font-semibold">{offer.job_title}</span>
        {offer.candidate_email && (
          <span className="block text-[11px] text-slate-400">{offer.candidate_email}</span>
        )}
      </td>

      {/* BU & Dept */}
      <td className="py-3.5 px-4">
        <span className="font-semibold text-slate-800 block">{offer.business_unit || "OPS"}</span>
        <span className="text-xs text-slate-500">{offer.department}</span>
        <span className="block text-[10px] text-slate-400">Reports: {offer.reporting_to || "Manager"}</span>
      </td>

      {/* Compensation */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm text-[#253C7D] block">
            ${totalPackage.toLocaleString()}/mo
          </span>
          {isBasedOnQual && (
            <span className="text-[9px] font-extrabold text-blue-800 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-200">
              Based on Qual.
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 block">
          Base: ${offer.base_salary.toLocaleString()}
          {totalAllowances > 0 ? ` + $${totalAllowances} allow` : ""}
        </span>
        {offer.probation_salary && (
          <span className="text-[10px] text-amber-700 block">
            Prob: ${offer.probation_salary.toLocaleString()} ({offer.probation_months}m)
          </span>
        )}
      </td>

      {/* Start Date */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="font-semibold text-slate-800 block">
          {offer.target_start_date ? new Date(offer.target_start_date).toLocaleDateString() : "—"}
        </span>
        <span className="text-[10px] text-slate-400">{offer.employment_type}</span>
      </td>

      {/* Workflow Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          <i className={cfg.icon} />
          Step {cfg.step}: {cfg.label}
        </span>
        {offer.expiry_date && offer.status === "issued" && (
          <span className="block text-[10px] text-sky-700 font-medium mt-1">
            Expires: {new Date(offer.expiry_date).toLocaleDateString()}
          </span>
        )}
        {offer.rejection_reason && offer.status === "rejected" && (
          <span
            className="block text-[10px] text-rose-600 font-medium mt-1 max-w-[180px] truncate"
            title={offer.rejection_reason}
          >
            Reason: {offer.rejection_reason}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <OfferTableRowActions
          offer={offer}
          isCurrentScopeHr={isCurrentScopeHr}
          onOpenWorkflowModal={onOpenWorkflowModal}
          onExportWord={onExportWord}
          onExportPdf={onExportPdf}
          onDeleteOffer={onDeleteOffer}
        />
      </td>
    </tr>
  );
});
