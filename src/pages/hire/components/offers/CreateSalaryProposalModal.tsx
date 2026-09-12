import { useState, useEffect, useMemo } from "react";
import type { Candidate, HiringRequest, OfferAllowanceItem } from "../../types";

interface CreateSalaryProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  candidates: Candidate[];
  hiringRequests: HiringRequest[];
  onSubmit: (payload: {
    candidate: Candidate;
    requisition?: HiringRequest | null;
    base_salary: number;
    probation_salary?: number | null;
    probation_months: number;
    target_start_date: string;
    allowances: OfferAllowanceItem[];
    benefits_summary: string;
    special_terms?: string;
    proposal_notes?: string;
  }) => Promise<any>;
}

export function CreateSalaryProposalModal({
  isOpen,
  onClose,
  candidate,
  candidates,
  hiringRequests,
  onSubmit,
}: CreateSalaryProposalModalProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedReqId, setSelectedReqId] = useState<string>("");

  const [baseSalary, setBaseSalary] = useState<number | "">("");
  const [isBasedOnQualification, setIsBasedOnQualification] = useState(false);
  const [probationSalary, setProbationSalary] = useState<number | "">("");
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [targetStartDate, setTargetStartDate] = useState<string>("");
  const [allowances, setAllowances] = useState<OfferAllowanceItem[]>([
    { name: "Transportation Allowance", amount: 50 },
    { name: "Phone Allowance", amount: 30 },
  ]);
  const [benefitsSummary, setBenefitsSummary] = useState<string>(
    "Comprehensive health & accident insurance, 18 days annual paid leave, public holidays as per labor law, and annual KPI performance appraisal."
  );
  const [specialTerms, setSpecialTerms] = useState<string>("");
  const [proposalNotes, setProposalNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Active candidate
  const activeCandidate = useMemo(() => {
    if (candidate) return candidate;
    return candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [candidate, candidates, selectedCandidateId]);

  // Find matching requisition
  const matchedReq = useMemo(() => {
    if (selectedReqId) {
      return hiringRequests.find((r) => r.id === selectedReqId) || null;
    }
    if (!activeCandidate) return null;
    // Auto-match by job_posting_id or title
    return (
      hiringRequests.find(
        (r) =>
          (activeCandidate.job_posting_id && r.job_posting_id === activeCandidate.job_posting_id) ||
          r.title.toLowerCase() === (activeCandidate.job_postings?.title || "").toLowerCase()
      ) || null
    );
  }, [activeCandidate, hiringRequests, selectedReqId]);

  useEffect(() => {
    if (candidate) {
      setSelectedCandidateId(candidate.id);
    } else if (candidates.length > 0 && !selectedCandidateId) {
      // Prioritize candidate in 'selected' stage
      const selectedOne = candidates.find((c) => c.stage === "selected" || c.stage === "salary_negotiation");
      setSelectedCandidateId(selectedOne ? selectedOne.id : candidates[0].id);
    }
  }, [candidate, candidates, selectedCandidateId]);

  // Pre-fill target start date & salary when candidate / req changes
  useEffect(() => {
    if (!targetStartDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      setTargetStartDate(nextMonth.toISOString().split("T")[0]);
    }

    if (activeCandidate?.expected_salary && baseSalary === "") {
      setBaseSalary(activeCandidate.expected_salary);
    } else if (matchedReq?.salary_min && baseSalary === "") {
      setBaseSalary(matchedReq.salary_min);
    }
  }, [activeCandidate, matchedReq, targetStartDate, baseSalary]);

  if (!isOpen) return null;

  const handleAddAllowance = () => {
    setAllowances([...allowances, { name: "", amount: 0 }]);
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleUpdateAllowance = (index: number, field: "name" | "amount", value: any) => {
    const next = [...allowances];
    if (field === "amount") {
      next[index].amount = Number(value) || 0;
    } else {
      next[index].name = value;
    }
    setAllowances(next);
  };

  const totalAllowances = allowances.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPackage = (Number(baseSalary) || 0) + totalAllowances;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;
    if (!isBasedOnQualification && (!baseSalary || Number(baseSalary) <= 0)) {
      alert("Please enter a valid base salary or check 'Based on qualification'.");
      return;
    }
    if (!targetStartDate) {
      alert("Please specify the target commencement date.");
      return;
    }

    const finalBaseSalary = Number(baseSalary) || 0;
    const notesWithQual = isBasedOnQualification
      ? [proposalNotes, "[Salary: Based on Qualification]"].filter(Boolean).join("\n")
      : proposalNotes;
    const termsWithQual = isBasedOnQualification
      ? [specialTerms, "Salary based on qualification & performance."].filter(Boolean).join(" ")
      : specialTerms;

    setSubmitting(true);
    try {
      await onSubmit({
        candidate: activeCandidate,
        requisition: matchedReq,
        base_salary: finalBaseSalary,
        probation_salary: probationSalary ? Number(probationSalary) : null,
        probation_months: probationMonths,
        target_start_date: targetStartDate,
        allowances: allowances.filter((a) => a.name.trim() !== ""),
        benefits_summary: benefitsSummary,
        special_terms: termsWithQual || undefined,
        proposal_notes: notesWithQual || undefined,
      });
      onClose();
    } catch {
      // Handled by hook toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#172B4D] to-[#253C7D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              <i className="ri-money-dollar-circle-line" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Create Salary Proposal</h2>
              <p className="text-xs text-blue-100/80">Step 1 of Offer Lifecycle &middot; Auto-bound with zero retyping</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Candidate & Position Auto-Populated Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-user-star-line text-blue-600" /> Candidate &amp; Requisition Reference
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Auto-bound from System
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Selected Candidate</label>
                {candidate ? (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{candidate.full_name}</span>
                    <span className="text-xs font-normal text-slate-500">{candidate.email || candidate.phone}</span>
                  </div>
                ) : (
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} — {c.job_postings?.title || "Applicant"} ({c.stage})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Associated Requisition / Job</label>
                <select
                  value={matchedReq?.id || selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {matchedReq && <option value={matchedReq.id}>{matchedReq.title} ({matchedReq.department}) — {matchedReq.business_unit || "OPS"}</option>}
                  {hiringRequests
                    .filter((r) => r.id !== matchedReq?.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.department}) — Budget: ${r.salary_min || 0} - ${r.salary_max || 0}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Readonly info summary pills */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
                <span className="font-semibold text-slate-800">{matchedReq?.title || activeCandidate?.job_postings?.title || "Specialist"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                <span className="font-semibold text-slate-800">{matchedReq?.department || activeCandidate?.job_postings?.department || "Operations"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Req Budget</span>
                <span className="font-semibold text-blue-700">
                  {matchedReq?.salary_min ? `$${matchedReq.salary_min} – $${matchedReq.salary_max}` : "Open"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Ask</span>
                <span className="font-semibold text-emerald-700">
                  {activeCandidate?.expected_salary ? `$${activeCandidate.expected_salary}/mo` : "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Core Compensation Package */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-wallet-3-line text-blue-600" /> Proposed Remuneration &amp; Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Gross Base Salary ($/mo) {!isBasedOnQualification && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required={!isBasedOnQualification}
                    placeholder={isBasedOnQualification ? "e.g. 300 (or leave 0)" : "e.g. 800"}
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                      isBasedOnQualification ? "border-blue-400 bg-blue-50/20" : "border-slate-300"
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer select-none transition-all ${
                      isBasedOnQualification
                        ? "bg-blue-50 border-blue-300 text-blue-800 shadow-2xs font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBasedOnQualification}
                      onChange={(e) => setIsBasedOnQualification(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Based on qualification</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Probation Salary ($/mo) <span className="text-slate-400 text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 700"
                    value={probationSalary}
                    onChange={(e) => setProbationSalary(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-2">
                  During probation period
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Probation Duration</label>
                <select
                  value={probationMonths}
                  onChange={(e) => setProbationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months (Standard)</option>
                  <option value={6}>6 Months</option>
                </select>
                <span className="text-[11px] text-slate-400 block mt-2">
                  Standard trial duration
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Commencement Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetStartDate}
                  onChange={(e) => setTargetStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Working Schedule</label>
                <input
                  type="text"
                  readOnly
                  value="Monday to Saturday Half (8:00 am – 5:00 pm)"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Guaranteed Monthly Allowances */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monthly Allowances
              </label>
              <button
                type="button"
                onClick={handleAddAllowance}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <i className="ri-add-circle-line" /> Add Allowance
              </button>
            </div>

            <div className="space-y-2">
              {allowances.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Allowance description (e.g. Phone, Transport)"
                    value={item.name}
                    onChange={(e) => handleUpdateAllowance(idx, "name", e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.amount}
                      onChange={(e) => handleUpdateAllowance(idx, "amount", e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllowance(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total package callout */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-blue-900">Total Monthly Compensation Package:</span>
              <div className="text-right flex items-center gap-2">
                {isBasedOnQualification && (
                  <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-200">
                    Based on Qualification
                  </span>
                )}
                <span className="text-base font-black text-blue-900">${totalPackage.toLocaleString()} / month</span>
              </div>
            </div>
          </div>

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
              placeholder="Explain why this salary package is recommended (e.g. strong technical assessment, 5 years relevant React Native experience)..."
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
                <span className="text-blue-900">This form will be sent across to the HR Division for review to generate the offer letter.</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shrink-0">
              HR Division
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-[#253C7D] hover:bg-[#1e3066] rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-2-line" />}
              Send Form to HR Division for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
