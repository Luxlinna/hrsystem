import { useState } from "react";
import type { Candidate, OfferLetter } from "../../types";
import { createContractDraft } from "../../services/contractService";
import { toast } from "@/components/Toast";

interface GenerateContractModalProps {
  isOpen: boolean;
  candidate: Candidate;
  offer: OfferLetter | null;
  actorName: string;
  onClose: () => void;
  onContractCreated: () => void;
}

export function GenerateContractModal({
  isOpen,
  candidate,
  offer,
  actorName,
  onClose,
  onContractCreated,
}: GenerateContractModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [contractType, setContractType] = useState<"probationary" | "fixed_term" | "permanent">("probationary");
  const [startDate, setStartDate] = useState(offer?.start_date || new Date().toISOString().split("T")[0]);
  const [probationMonths, setProbationMonths] = useState(offer?.probation_months || 3);
  const [salary, setSalary] = useState(offer?.offered_salary || 0);
  const [currency] = useState(offer?.currency || "USD");

  if (!isOpen) return null;

  const positionTitle = offer?.job_title || candidate.job_postings?.title || "Staff";
  const department = offer?.department || candidate.job_postings?.department || "General";
  const businessUnit = candidate.job_postings?.branches?.name || "Headquarters";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createContractDraft({
        candidate_id: candidate.id,
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        job_posting_id: candidate.job_postings?.id || null,
        position_title: positionTitle,
        department,
        branch_id: candidate.job_postings?.branch_id || null,
        business_unit_name: businessUnit,
        offer_id: offer?.id || null,
        offer_reference: offer?.offer_reference || null,
        contract_type: contractType,
        start_date: startDate,
        probation_months: Number(probationMonths),
        monthly_salary: Number(salary),
        currency,
        created_by_name: actorName,
      });

      toast("Contract Generated", "Employment contract draft created and moved to HR Review.", "success");
      onContractCreated();
      onClose();
    } catch (err: any) {
      toast("Error", err.message || "Failed to generate contract", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-[#253C7D]">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <i className="ri-file-add-line text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Generate Employment Contract</h3>
              <p className="text-[11px] text-gray-400">Step 1: Draft official contract from accepted offer terms</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Linkage Breadcrumb Summary */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#FAFBFD] border border-blue-100/80 text-[11px] text-gray-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-900">
            <span>{candidate.full_name}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span>{positionTitle}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span>{businessUnit}</span>
          </div>
          <p className="text-gray-500">Linked Offer: {offer?.offer_reference || "Accepted Offer"} • Base: ${salary} {currency}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Contract Type</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as any)}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#253C7D]"
              >
                <option value="probationary">Probationary (Standard)</option>
                <option value="fixed_term">Fixed Term</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Probation (Months)</label>
              <input
                type="number"
                min={0}
                max={12}
                value={probationMonths}
                onChange={(e) => setProbationMonths(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Monthly Salary ({currency})</label>
              <input
                type="number"
                required
                min={0}
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

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
              <span>Generate Contract</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
