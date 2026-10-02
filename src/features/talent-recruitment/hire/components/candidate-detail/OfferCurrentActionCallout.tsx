import { memo } from "react";
import type { OfferLetter } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";
import type { getOfferSignatories } from "../../services/offerLetterService";

interface OfferCurrentActionCalloutProps {
  offer: OfferLetter | null;
  currentStepNumber: number;
  sigs: ReturnType<typeof getOfferSignatories> | null;
  isCurrentScopeHr: boolean;
  canSwitchToHr: boolean;
  handleSwitchToHr: () => void;
  isSuperAdmin: boolean;
  onOpenCreateProposal: () => void;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

export const OfferCurrentActionCallout = memo(function OfferCurrentActionCallout({
  offer,
  currentStepNumber,
  sigs,
  isCurrentScopeHr,
  canSwitchToHr,
  handleSwitchToHr,
  isSuperAdmin,
  onOpenCreateProposal,
  onOpenWorkflowModal,
  onExportPdf,
  onExportWord,
}: OfferCurrentActionCalloutProps) {
  return (
    <div className="mt-5 p-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-flashlight-line text-amber-500" />
            Current Actionable Step
          </span>
          <span className="text-xs font-semibold text-slate-600">
            (Step {Math.min(currentStepNumber, 7)} of 7)
          </span>
        </div>

        {/* Step 1 guidance: Proposal */}
        {!offer && (
          <p className="text-xs text-slate-600">
            Candidate is ready for compensation proposal. Submit the salary proposal with base compensation and allowances.
          </p>
        )}

        {/* Step 2 guidance: BU CEO Approval */}
        {offer && (offer.status === "pending_bu_ceo" || (offer.status === "salary_proposal" && sigs?.bu_ceo.status !== "approved")) && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-200">
                Step 2: BU CEO Approval
              </span>
              <span className="text-xs text-blue-950 font-bold">Awaiting {offer.business_unit || "BU"} CEO Sign-off</span>
            </div>
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              The salary proposal must be approved by the <strong>BU CEO / Division Director</strong> for {offer.business_unit || "this BU"} before proceeding to the HR Division.
            </p>
          </div>
        )}

        {/* Step 3 guidance: HR Manager Review */}
        {offer && (offer.status === "pending_hr_manager" || offer.status === "draft_letter" || offer.status === "hr_review") && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 border border-indigo-200">
                Step 3: HR Manager Review
              </span>
              <span className="text-xs text-indigo-950 font-bold">HR Division Reviewing Form</span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              BU CEO has approved. The offer letter has moved across to the <strong>HR Division</strong> for compliance review and HR Manager endorsement.
            </p>
          </div>
        )}

        {/* Step 4 guidance: HR Admin Director */}
        {offer && offer.status === "pending_hr_director" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-900 border border-slate-200">
                Step 4: HR Admin Director
              </span>
              <span className="text-xs text-slate-950 font-bold">Executive HR Authorization</span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Endorsed by HR Manager. Awaiting executive sign-off from the <strong>HR Admin Director</strong> in the HR Division.
            </p>
          </div>
        )}

        {/* Step 5 guidance: Chairwoman Supreme Authorization */}
        {offer && (offer.status === "pending_chairwoman" || offer.status === "management_approval") && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                Step 5: Chairwoman
              </span>
              <span className="text-xs text-amber-950 font-bold">Supreme Corporate Authorization</span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Approved by BU CEO, HR Manager, and HR Admin Director. Awaiting final supreme corporate authorization by the <strong>Chairwoman</strong>.
            </p>
          </div>
        )}

        {/* Step 6 guidance: Ready to Issue */}
        {offer && (offer.status === "approved" || offer.status === "salary_approved") && (
          <p className="text-xs text-slate-700 font-medium">
            Fully authorized by the Chairwoman! Set the offer validity deadline to issue the official offer letter PDF to {offer.candidate_name}.
          </p>
        )}

        {/* Step 7 guidance: Awaiting Response */}
        {offer && offer.status === "issued" && (
          <p className="text-xs text-slate-700 font-medium">
            Official offer letter has been issued (Expires: {offer.expiry_date || "in 7 days"}). Record the candidate's acceptance or decline.
          </p>
        )}

        {/* Completed */}
        {offer && offer.status === "accepted" && (
          <p className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            Candidate accepted the employment offer! Target joining date confirmed: {offer.target_start_date || "Confirmed"}.
          </p>
        )}

        {offer && offer.status === "rejected" && (
          <p className="text-xs text-rose-800 font-bold flex items-center gap-1.5">
            <i className="ri-close-circle-fill text-rose-600" />
            Candidate declined the offer (Reason: {offer.rejection_reason || "Not specified"}).
          </p>
        )}
      </div>

      {/* Action Buttons for current state */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {!offer && (
          <button
            type="button"
            onClick={onOpenCreateProposal}
            className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <i className="ri-add-line text-sm" />
            Create Salary Proposal
          </button>
        )}

        {/* Step 2: BU CEO Approval */}
        {offer && (offer.status === "pending_bu_ceo" || (offer.status === "salary_proposal" && sigs?.bu_ceo.status !== "approved")) &&
          (!isCurrentScopeHr || isSuperAdmin ? (
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "bu_ceo_approval")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-2 animate-pulse"
              title={`Approve salary proposal as CEO of ${offer.business_unit || "BU"}`}
            >
              <i className="ri-user-star-line text-sm" />
              BU CEO Approve Proposal
            </button>
          ) : (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-950">
              <i className="ri-time-line text-blue-600 shrink-0 text-base" />
              <span>
                Awaiting BU CEO sign-off in <strong>{offer.business_unit || "Business Unit"}</strong> before crossing to HR Division.
              </span>
            </div>
          ))}

        {/* Step 3: HR Manager Review */}
        {offer && (offer.status === "pending_hr_manager" || offer.status === "draft_letter" || offer.status === "hr_review") &&
          (isCurrentScopeHr ? (
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "hr_manager_approval")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i className="ri-shield-check-line text-sm" />
              HR Manager Review &amp; Approve
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950">
                <i className="ri-send-plane-2-line text-indigo-600 shrink-0 text-base" />
                <span>
                  Proposal approved by BU CEO. Forwarded to <strong>HR Division</strong> for HR Manager Review.
                </span>
              </div>
              {canSwitchToHr && (
                <button
                  type="button"
                  onClick={handleSwitchToHr}
                  className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to HR Division & Review
                </button>
              )}
            </div>
          ))}

        {/* Step 4: HR Admin Director */}
        {offer && offer.status === "pending_hr_director" &&
          (isCurrentScopeHr ? (
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "hr_director_approval")}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i className="ri-shield-user-line text-sm" />
              HR Admin Director Authorize
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-800">
                <i className="ri-time-line text-slate-600 shrink-0 text-base" />
                <span>
                  Awaiting <strong>HR Admin Director Authorization</strong> in HR Division.
                </span>
              </div>
              {canSwitchToHr && (
                <button
                  type="button"
                  onClick={handleSwitchToHr}
                  className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to HR Division & Review
                </button>
              )}
            </div>
          ))}

        {/* Step 5: Chairwoman Supreme Sign-off */}
        {offer && (offer.status === "pending_chairwoman" || offer.status === "management_approval") &&
          (isCurrentScopeHr ? (
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "chairwoman_approval")}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i className="ri-vip-crown-line text-sm" />
              Chairwoman Supreme Authorization
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-950">
                <i className="ri-vip-crown-line text-amber-600 shrink-0 text-base" />
                <span>
                  Awaiting <strong>Chairwoman Supreme Authorization</strong> in HR Division.
                </span>
              </div>
              {canSwitchToHr && (
                <button
                  type="button"
                  onClick={handleSwitchToHr}
                  className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to HR Division & Review
                </button>
              )}
            </div>
          ))}

        {/* Step 6: Issue Official Offer */}
        {offer && (offer.status === "approved" || offer.status === "salary_approved") &&
          (isCurrentScopeHr ? (
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "issue_offer")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i className="ri-mail-send-line text-sm" />
              Issue Official Offer Letter
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-950">
                <i className="ri-checkbox-circle-line text-emerald-600 shrink-0 text-base" />
                <span>
                  Fully authorized by Chairwoman. Awaiting issuance by <strong>HR Division</strong>.
                </span>
              </div>
              {canSwitchToHr && (
                <button
                  type="button"
                  onClick={handleSwitchToHr}
                  className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to HR Division & Review
                </button>
              )}
            </div>
          ))}

        {/* Step 7: Decision */}
        {offer && offer.status === "issued" && (
          <div className="flex items-center gap-2">
            {onExportWord && (
              <button
                type="button"
                onClick={() => onExportWord(offer)}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Export official Offer Letter as Word document"
              >
                <i className="ri-file-word-line text-sky-700 text-sm" />
                Word (.docx)
              </button>
            )}
            <button
              type="button"
              onClick={() => onExportPdf(offer)}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-file-pdf-line text-red-600 text-sm" />
              View PDF
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkflowModal(offer, "decision")}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i className="ri-question-answer-line text-sm" />
              Record Candidate Response
            </button>
          </div>
        )}

        {/* Completed status exports */}
        {offer && ["accepted", "rejected"].includes(offer.status) && (
          <div className="flex items-center gap-2">
            {onExportWord && (
              <button
                type="button"
                onClick={() => onExportWord(offer)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-file-word-line text-sky-700 text-sm" />
                Download Offer Letter Word
              </button>
            )}
            <button
              type="button"
              onClick={() => onExportPdf(offer)}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-file-pdf-line text-red-600 text-sm" />
              Download Offer Letter PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
