import { useState } from "react";
import type { OfferLetter } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";

interface OfferWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: OfferLetter | null;
  modalType: WorkflowModalType;
  actorName?: string;
  onApproveSalary?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onGenerateDraft?: (offer: OfferLetter) => Promise<void>;
  onEndorseHrReview: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveManagement: (offer: OfferLetter, notes?: string) => Promise<void>;
  onIssueOffer: (offer: OfferLetter, expiryDate?: string) => Promise<void>;
  onRecordDecision: (
    offer: OfferLetter,
    decision: "accepted" | "rejected",
    notes?: string,
    rejectionReason?: string
  ) => Promise<void>;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

export function OfferWorkflowModal({
  isOpen,
  onClose,
  offer,
  modalType,
  actorName,
  onApproveSalary,
  onGenerateDraft,
  onEndorseHrReview,
  onApproveManagement,
  onIssueOffer,
  onRecordDecision,
  onExportPdf,
  onExportWord,
}: OfferWorkflowModalProps) {
  const [notes, setNotes] = useState("");
  const [hrReviewer, setHrReviewer] = useState(actorName || "HR Manager");
  const [checkTerms, setCheckTerms] = useState(true);
  const [checkRemuneration, setCheckRemuneration] = useState(true);
  const [checkProbation, setCheckProbation] = useState(true);
  const [checkCompliance, setCheckCompliance] = useState(true);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [decision, setDecision] = useState<"accepted" | "rejected">("accepted");
  const [rejectionReason, setRejectionReason] = useState("Accepted competing offer");
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !offer || !modalType || modalType === "preview") return null;

  const totalAllowances = (offer.allowances || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;

  const handleAction = async () => {
    setSubmitting(true);
    try {
      if (modalType === "salary_approval" && onApproveSalary) {
        await onApproveSalary(offer, notes);
      } else if (modalType === "generate_draft" && onGenerateDraft) {
        await onGenerateDraft(offer);
      } else if (modalType === "hr_review") {
        const reviewNotes = notes
          ? `[HR Reviewer: ${hrReviewer.trim() || actorName || "HR Manager"}] ${notes}`
          : `[HR Reviewer: ${hrReviewer.trim() || actorName || "HR Manager"}] Endorsed compliance and verified terms.`;
        await onEndorseHrReview(offer, reviewNotes);
      } else if (modalType === "management_approval") {
        await onApproveManagement(offer, notes);
      } else if (modalType === "issue_offer") {
        await onIssueOffer(offer, expiryDate);
      } else if (modalType === "decision") {
        const finalReason = rejectionReason === "Other" ? otherReason : rejectionReason;
        await onRecordDecision(offer, decision, notes, finalReason);
      }
      onClose();
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const titles: Record<string, { title: string; subtitle: string; icon: string; actionBtn: string; color: string }> = {
    salary_approval: {
      title: "Salary Package Sign-Off",
      subtitle: "Step 1: BU Head / Finance / HR Director Review",
      icon: "ri-money-dollar-circle-line",
      actionBtn: "Approve Proposed Salary",
      color: "from-blue-700 to-indigo-800",
    },
    generate_draft: {
      title: "HR Division Review & Generate Offer Letter",
      subtitle: "Step 2: Form sent to HR Division. Review terms & click Generate Offer Letter",
      icon: "ri-file-text-line",
      actionBtn: "Generate Offer Letter",
      color: "from-blue-700 to-indigo-800",
    },
    hr_review: {
      title: "HR Manager Offer Letter Review",
      subtitle: "Step 3: Review compiled letter, verify compliance, & endorse for executive approval",
      icon: "ri-shield-check-line",
      actionBtn: "Endorse as HR Manager & Forward to Management",
      color: "from-indigo-800 via-blue-900 to-[#253C7D]",
    },
    management_approval: {
      title: "Final Management Authorization",
      subtitle: "Step 4: Executive sign-off to authorize offer issuance",
      icon: "ri-award-line",
      actionBtn: "Authorize & Approve Offer",
      color: "from-purple-700 to-slate-900",
    },
    issue_offer: {
      title: "Issue Official Offer Letter",
      subtitle: "Step 5: Transmit official document & update pipeline to Offer",
      icon: "ri-mail-send-line",
      actionBtn: "Issue Official Offer & Generate PDF",
      color: "from-emerald-700 to-teal-900",
    },
    decision: {
      title: "Record Candidate Response",
      subtitle: "Step 6: Candidate acceptance or rejection outcome",
      icon: "ri-question-answer-line",
      actionBtn: decision === "accepted" ? "Confirm Candidate Accepted" : "Confirm Candidate Declined",
      color: decision === "accepted" ? "from-emerald-700 to-teal-800" : "from-rose-700 to-red-900",
    },
  };

  const meta = titles[modalType] || titles.salary_approval;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${meta.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              <i className={meta.icon} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">{meta.title}</h2>
              <p className="text-xs text-blue-100/80">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-slate-800">
          {/* Candidate & Role banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{offer.candidate_name}</h4>
              <p className="text-xs text-slate-500">
                {offer.job_title} &middot; {offer.department} ({offer.business_unit})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Ref Number</span>
              <span className="text-xs font-mono font-bold text-[#253C7D]">{offer.offer_number}</span>
            </div>
          </div>

          {/* Salary Breakdown Summary Card */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Base Salary:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {offer.base_salary > 0 ? `$${offer.base_salary.toLocaleString()} / month` : ""}
                {((offer.special_terms || "").toLowerCase().includes("qualification") ||
                  (offer.proposal_notes || "").toLowerCase().includes("qualification")) && (
                  <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-200">
                    Based on Qualification
                  </span>
                )}
              </span>
            </div>
            {offer.probation_salary && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Probation Salary ({offer.probation_months} mo):</span>
                <span className="font-semibold text-slate-800">${offer.probation_salary.toLocaleString()} / month</span>
              </div>
            )}
            {offer.allowances && offer.allowances.length > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Monthly Allowances:</span>
                <span className="font-semibold text-slate-800">+${totalAllowances.toLocaleString()} / month</span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-200/80 flex justify-between items-center text-sm font-bold text-blue-900">
              <span>Total Remuneration Package:</span>
              <span className="text-base font-black">${totalPackage.toLocaleString()} / month</span>
            </div>
          </div>

          {/* Generate Draft Specific: HR Division Review & Automated Compilation */}
          {modalType === "generate_draft" && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
                  <i className="ri-file-text-line text-blue-700 text-sm" />
                  <span>Form Received by HR Division for Review</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  HR Division
                </span>
              </div>
              <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
                The form has been sent across to the <strong>HR Division for review</strong>. Verify the details below and click <strong>Generate Offer Letter</strong> to compile the official document directly from candidate and requisition records —{" "}
                <span className="font-bold text-blue-950 underline decoration-blue-400 decoration-2">
                  no retyping of name, role, salary, or start date
                </span>
                .
              </p>
              <div className="pt-2 border-t border-blue-100 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase">Candidate</span>
                  <span className="font-bold text-slate-900 truncate block">{offer.candidate_name}</span>
                </div>
                <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase">Designation</span>
                  <span className="font-bold text-slate-900 truncate block">{offer.job_title}</span>
                </div>
                <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase">Target Start Date</span>
                  <span className="font-bold text-slate-900 truncate block">{offer.target_start_date || "To be confirmed"}</span>
                </div>
                <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase">Department / BU</span>
                  <span className="font-bold text-slate-900 truncate block">{offer.department} ({offer.business_unit})</span>
                </div>
              </div>
            </div>
          )}

          {/* HR Review Specific: HR Manager Verification & PDF preview */}
          {modalType === "hr_review" && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950">
                  <i className="ri-shield-check-line text-indigo-600 text-base" />
                  <span>HR Manager Review & Verification Checklist</span>
                </div>
                <button
                  type="button"
                  onClick={() => onExportPdf(offer)}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Preview or print the generated offer letter PDF"
                >
                  <i className="ri-file-pdf-line text-rose-600" />
                  <span>Preview Offer PDF</span>
                </button>
              </div>

              <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                The offer letter draft has been compiled from candidate and requisition records. Please verify compliance, review clauses, and sign off as HR Manager before forwarding to management.
              </p>

              {/* Checklist */}
              <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-indigo-100 text-xs">
                <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkTerms}
                    onChange={(e) => setCheckTerms(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Candidate name, designation & department match approved requisition</span>
                </label>
                <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkRemuneration}
                    onChange={(e) => setCheckRemuneration(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Base salary (${offer.base_salary.toLocaleString()}) and allowances match approved proposal</span>
                </label>
                <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkProbation}
                    onChange={(e) => setCheckProbation(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Probation period ({offer.probation_months} months) and standard employment clauses verified</span>
                </label>
                <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkCompliance}
                    onChange={(e) => setCheckCompliance(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>All compliance standards met; endorsed for executive management approval</span>
                </label>
              </div>

              {/* Reviewing HR Manager Name */}
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Reviewing HR Manager <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hrReviewer}
                  onChange={(e) => setHrReviewer(e.target.value)}
                  placeholder="e.g. Ms. Chea TiengChanvathna"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Issue Offer specific: Expiry Date */}
          {modalType === "issue_offer" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Offer Validity Deadline</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500">
                Candidate must accept by this date. Official PDF will be generated immediately upon issuance.
              </p>
            </div>
          )}

          {/* Decision specific: Accept vs Reject Radio */}
          {modalType === "decision" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">Candidate Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("accepted")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    decision === "accepted"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <i className="ri-checkbox-circle-fill text-lg text-emerald-600 block mb-1" />
                  <span className="text-xs">Candidate Accepted</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    decision === "rejected"
                      ? "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <i className="ri-close-circle-fill text-lg text-rose-600 block mb-1" />
                  <span className="text-xs">Candidate Declined</span>
                </button>
              </div>

              {decision === "rejected" && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-slate-700 block">Primary Decline Reason</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Accepted competing offer">Accepted competing offer</option>
                    <option value="Salary expectation not met">Salary expectation not met</option>
                    <option value="Counter-offer from current employer">Counter-offer from current employer</option>
                    <option value="Commute distance / Location">Commute distance / Location</option>
                    <option value="Personal / Family circumstances">Personal / Family circumstances</option>
                    <option value="Other">Other reason...</option>
                  </select>

                  {rejectionReason === "Other" && (
                    <input
                      type="text"
                      placeholder="Specify reason..."
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Notes textarea */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {modalType === "decision" ? "Candidate Response Notes" : "Approval / Review Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              placeholder="Add any context, remarks, or specific instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* PDF and Word Quick Download if already generated */}
          {!["salary_proposal"].includes(offer.status) && (
            <div className="pt-2 flex items-center justify-end gap-2">
              {onExportWord && (
                <button
                  type="button"
                  onClick={() => onExportWord(offer)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 cursor-pointer bg-sky-50/80 hover:bg-sky-100/80 px-3 py-1.5 rounded-lg border border-sky-200/60 transition-colors"
                  title="Download official Offer Letter Word document (.docx)"
                >
                  <i className="ri-file-word-line text-sm text-sky-700" /> Export Word (.docx)
                </button>
              )}
              <button
                type="button"
                onClick={() => onExportPdf(offer)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/60 transition-colors"
                title="Preview or print official Offer Letter PDF"
              >
                <i className="ri-file-pdf-line text-sm text-rose-600" /> Preview / Print PDF
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleAction}
            className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1e3066] rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <i className="ri-loader-4-line animate-spin" /> : <i className={meta.icon} />}
            {meta.actionBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
