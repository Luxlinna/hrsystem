import { useState } from "react";
import type { EmploymentContract, ContractModalType } from "../../types/contractTypes";
import {
  endorseHrReview,
  approveByHrDirector,
  authorizeByChairwoman,
  issueContract,
  recordContractSignature,
} from "../../services/contractService";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface ContractWorkflowModalProps {
  type: ContractModalType;
  contract: EmploymentContract;
  actorName: string;
  onClose: () => void;
  onActionComplete: () => void;
}

export function ContractWorkflowModal({
  type,
  contract,
  actorName,
  onClose,
  onActionComplete,
}: ContractWorkflowModalProps) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);

  if (!type) return null;

  const isHrReview = type === "hr_review";
  const isHrDirector = type === "hr_director_approval";
  const isChairwoman = type === "chairwoman_approval";
  const isIssue = type === "issue_contract";
  const isSign = type === "sign_contract";

  const title = isHrReview
    ? "Endorse HR Review"
    : isHrDirector
    ? "HR Director Approval"
    : isChairwoman
    ? "Chairwoman Approval"
    : isIssue
    ? "Issue Employment Contract"
    : "Record Contract Countersignature";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isHrReview) {
        await endorseHrReview(contract.id, actorName, notes);
        toast("HR Review Endorsed", "Contract advanced to HR Director Approval.", "success");
      } else if (isHrDirector) {
        await approveByHrDirector(contract.id, actorName, notes);
        toast("HR Director Approved", "Contract advanced to Chairwoman Approval.", "success");
      } else if (isChairwoman) {
        await authorizeByChairwoman(contract.id, actorName, notes);
        toast("Chairwoman Authorized", "Contract ready for official issuance.", "success");
      } else if (isIssue) {
        await issueContract(contract.id, actorName);
        toast("Contract Issued", "Contract sent to candidate for signature.", "success");
      } else if (isSign) {
        let signedUrl: string | undefined;
        if (signedFile) {
          const s3Item = await uploadFileToS3(signedFile, `contracts/${contract.id}/signed`);
          signedUrl = s3Item.url;
        }
        await recordContractSignature(contract.id, signedUrl);
        toast("Contract Completed", "Contract signed, verified, and archived in AWS S3.", "success");
      }
      onActionComplete();
      onClose();
    } catch (err: any) {
      toast("Action Failed", err.message || "Could not complete workflow action", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-sm text-gray-900">{title}</h3>
            <p className="text-[11px] text-gray-400">Contract #{contract.contract_number} • {contract.candidate_name}</p>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {isSign && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Attach Countersigned Contract PDF (AWS S3)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                className="w-full text-xs p-2 rounded-xl border border-gray-200"
              />
              <p className="text-[10px] text-gray-400">Upload the dual-signed PDF with candidate & company signature.</p>
            </div>
          )}

          {!isIssue && !isSign && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Reviewer Notes / Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter approval comments, compliance notes, or terms verification..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}

          {isIssue && (
            <p className="text-xs text-gray-600 bg-teal-50 p-3 rounded-2xl border border-teal-200 text-teal-800">
              Issuing this contract will mark it ready for candidate review and countersignature.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1E3066] rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-60"
            >
              {submitting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-check-line" />}
              <span>Confirm & Proceed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
