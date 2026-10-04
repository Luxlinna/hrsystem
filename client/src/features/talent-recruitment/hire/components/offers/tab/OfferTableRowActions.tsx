import { memo } from "react";
import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";
import { getOfferSignatories } from "../../../services/offerLetterService";

interface OfferTableRowActionsProps {
  offer: OfferLetter;
  isCurrentScopeHr: boolean;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onExportWord?: (offer: OfferLetter) => void;
  onExportPdf: (offer: OfferLetter) => void;
  onDeleteOffer: (offer: OfferLetter) => void;
}

export const OfferTableRowActions = memo(function OfferTableRowActions({
  offer,
  isCurrentScopeHr,
  onOpenWorkflowModal,
  onExportWord,
  onExportPdf,
  onDeleteOffer,
}: OfferTableRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Step 2: BU CEO Approval */}
      {(offer.status === "pending_bu_ceo" ||
        (offer.status === "salary_proposal" && getOfferSignatories(offer).bu_ceo.status !== "approved")) && (
        <button
          type="button"
          onClick={() => onOpenWorkflowModal(offer, "bu_ceo_approval")}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          title={`Approve proposal as CEO of ${offer.business_unit || "BU"}`}
        >
          <i className="ri-user-star-line" /> BU CEO Approve
        </button>
      )}

      {/* Step 3: HR Manager Review */}
      {(offer.status === "pending_hr_manager" || offer.status === "draft_letter" || offer.status === "hr_review") &&
        (isCurrentScopeHr ? (
          <button
            type="button"
            onClick={() => onOpenWorkflowModal(offer, "hr_manager_approval")}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <i className="ri-shield-check-line" /> HR Manager Review
          </button>
        ) : (
          <span
            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
            title="This offer letter is under review by the HR Division"
          >
            <i className="ri-send-plane-2-line text-indigo-600" /> Sent to HR Division
          </span>
        ))}

      {/* Step 4: HR Admin Director Authorization */}
      {offer.status === "pending_hr_director" &&
        (isCurrentScopeHr ? (
          <button
            type="button"
            onClick={() => onOpenWorkflowModal(offer, "hr_director_approval")}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <i className="ri-shield-user-line" /> HR Director Authorize
          </button>
        ) : (
          <span
            className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
            title="Under HR Admin Director Authorization in HR Division"
          >
            <i className="ri-time-line text-slate-600" /> In HR Director Approval
          </span>
        ))}

      {/* Step 5: Chairwoman Supreme Authorization */}
      {(offer.status === "pending_chairwoman" || offer.status === "management_approval") &&
        (isCurrentScopeHr ? (
          <button
            type="button"
            onClick={() => onOpenWorkflowModal(offer, "chairwoman_approval")}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <i className="ri-vip-crown-line" /> Chairwoman Sign-off
          </button>
        ) : (
          <span
            className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
            title="Under Chairwoman Supreme Authorization in HR Division"
          >
            <i className="ri-vip-crown-line text-amber-600" /> In Chairwoman Approval
          </span>
        ))}

      {/* Step 6: Approved -> Ready to Issue */}
      {(offer.status === "approved" || offer.status === "salary_approved") &&
        (isCurrentScopeHr ? (
          <button
            type="button"
            onClick={() => onOpenWorkflowModal(offer, "issue_offer")}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <i className="ri-mail-send-line" /> Issue Offer
          </button>
        ) : (
          <span
            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
            title="Fully authorized by Chairwoman, awaiting issuance by HR"
          >
            <i className="ri-checkbox-circle-line text-emerald-600" /> Authorized by Chairwoman
          </span>
        ))}

      {/* Step 7: Issued -> Record Decision */}
      {offer.status === "issued" && (
        <button
          type="button"
          onClick={() => onOpenWorkflowModal(offer, "decision")}
          className="px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
        >
          Record Decision
        </button>
      )}

      {/* Export Word & PDF Buttons */}
      {!["salary_proposal"].includes(offer.status) && (
        <>
          {onExportWord && (
            <button
              type="button"
              onClick={() => onExportWord(offer)}
              title="Export Official Offer Letter as Word (.docx)"
              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-file-word-line text-base text-sky-700" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onExportPdf(offer)}
            title="Preview / Print Official Offer Letter PDF"
            className="p-1.5 text-slate-600 hover:text-[#253C7D] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-file-pdf-line text-base text-rose-600" />
          </button>
        </>
      )}

      {/* Delete Offer Button */}
      <button
        type="button"
        onClick={() => onDeleteOffer(offer)}
        title="Delete / Cancel Offer"
        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
      >
        <i className="ri-delete-bin-line text-base" />
      </button>
    </div>
  );
});
