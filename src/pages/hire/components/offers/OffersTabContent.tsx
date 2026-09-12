import { useState, useMemo } from "react";
import type { OfferLetter, Candidate, HiringRequest, OfferStatus } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";
import { getOfferSignatories } from "../../services/offerLetterService";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";

interface OffersTabContentProps {
  offers: OfferLetter[];
  loading: boolean;
  candidates: Candidate[];
  hiringRequests: HiringRequest[];
  onOpenCreateProposal: (candidate?: Candidate | null) => void;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onGenerateDraft: (offer: OfferLetter) => Promise<void>;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
  onDeleteOffer: (offer: OfferLetter) => void;
}

const STATUS_CONFIG: Record<
  OfferStatus,
  { label: string; step: number; color: string; bg: string; border: string; icon: string }
> = {
  salary_proposal: {
    label: "Salary Proposal Submitted",
    step: 1,
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  pending_bu_ceo: {
    label: "Pending BU CEO Approval",
    step: 2,
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "ri-user-star-line",
  },
  pending_hr_manager: {
    label: "Pending HR Manager Review",
    step: 3,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-shield-check-line",
  },
  pending_hr_director: {
    label: "Pending HR Admin Director",
    step: 4,
    color: "text-slate-800",
    bg: "bg-slate-100",
    border: "border-slate-300",
    icon: "ri-shield-user-line",
  },
  pending_chairwoman: {
    label: "Pending Chairwoman Approval",
    step: 5,
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "ri-vip-crown-line",
  },
  salary_approved: {
    label: "Salary Proposal Ready",
    step: 1,
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "ri-check-line",
  },
  draft_letter: {
    label: "Offer Letter Generated",
    step: 2,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-file-text-line",
  },
  hr_review: {
    label: "Pending HR Review",
    step: 3,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-shield-user-line",
  },
  management_approval: {
    label: "Pending Management Approval",
    step: 4,
    color: "text-purple-800",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "ri-award-line",
  },
  approved: {
    label: "Approved & Ready to Issue",
    step: 5,
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-line",
  },
  issued: {
    label: "Offer Issued to Candidate",
    step: 5,
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "ri-mail-send-line",
  },
  accepted: {
    label: "Accepted by Candidate",
    step: 6,
    color: "text-teal-800",
    bg: "bg-teal-50",
    border: "border-teal-200",
    icon: "ri-thumb-up-line",
  },
  rejected: {
    label: "Offer Declined",
    step: 6,
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
  },
};

export function OffersTabContent({
  offers,
  loading,
  candidates,
  hiringRequests,
  onOpenCreateProposal,
  onOpenWorkflowModal,
  onGenerateDraft,
  onExportPdf,
  onExportWord,
  onDeleteOffer,
}: OffersTabContentProps) {
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  // Unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.department) set.add(o.department);
    });
    return Array.from(set);
  }, [offers]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = o.candidate_name.toLowerCase().includes(q);
        const matchTitle = o.job_title.toLowerCase().includes(q);
        const matchNum = o.offer_number.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchNum) return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "in_review") {
          if (
            ![
              "salary_proposal",
              "pending_bu_ceo",
              "pending_hr_manager",
              "pending_hr_director",
              "pending_chairwoman",
              "salary_approved",
              "draft_letter",
              "hr_review",
              "management_approval",
            ].includes(o.status)
          ) {
            return false;
          }
        } else if (statusFilter === "ready_to_issue") {
          if (o.status !== "approved") return false;
        } else if (o.status !== statusFilter) {
          return false;
        }
      }

      if (deptFilter !== "all" && o.department !== deptFilter) {
        return false;
      }

      return true;
    });
  }, [offers, search, statusFilter, deptFilter]);

  // Counts
  const metrics = useMemo(() => {
    const total = offers.length;
    const inReview = offers.filter((o) =>
      [
        "salary_proposal",
        "pending_bu_ceo",
        "pending_hr_manager",
        "pending_hr_director",
        "pending_chairwoman",
        "salary_approved",
        "draft_letter",
        "hr_review",
        "management_approval",
      ].includes(o.status)
    ).length;
    const readyToIssue = offers.filter((o) => o.status === "approved").length;
    const issued = offers.filter((o) => o.status === "issued").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const rejected = offers.filter((o) => o.status === "rejected").length;
    return { total, inReview, readyToIssue, issued, accepted, rejected };
  }, [offers]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Offers</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.total}</span>
          <span className="text-[11px] text-slate-500 font-medium">Recorded in system</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider block">In Approval</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.inReview}</span>
          <span className="text-[11px] text-amber-600 font-medium">Steps 1–5 in review</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider block">Ready to Issue</span>
          <span className="text-2xl font-black text-[#253C7D] mt-1 block">{metrics.readyToIssue}</span>
          <span className="text-[11px] text-blue-600 font-medium">Authorized by Mgmt</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-sky-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider block">Issued / Pending</span>
          <span className="text-2xl font-black text-sky-700 mt-1 block">{metrics.issued}</span>
          <span className="text-[11px] text-sky-600 font-medium">Awaiting response</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-teal-200/80 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-teal-600 tracking-wider block">Accepted</span>
          <span className="text-2xl font-black text-teal-700 mt-1 block">{metrics.accepted}</span>
          <span className="text-[11px] text-teal-600 font-medium">Ready for onboarding</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider block">Declined</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{metrics.rejected}</span>
          <span className="text-[11px] text-slate-500 font-medium">Offer declined</span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <i className="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search candidate, role, or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="all">All Statuses ({offers.length})</option>
            <option value="in_review">In Approval Pipeline ({metrics.inReview})</option>
            <option value="ready_to_issue">Ready to Issue ({metrics.readyToIssue})</option>
            <option value="issued">Issued / Awaiting ({metrics.issued})</option>
            <option value="accepted">Accepted ({metrics.accepted})</option>
            <option value="rejected">Declined ({metrics.rejected})</option>
          </select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>

        {/* Create Proposal Action Button */}
        <button
          type="button"
          onClick={() => onOpenCreateProposal()}
          className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <i className="ri-add-line text-sm" />
          Create Salary Proposal
        </button>
      </div>

      {/* Offers Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <i className="ri-loader-4-line text-3xl animate-spin block mb-2" />
          <span>Loading offer letters...</span>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#253C7D] flex items-center justify-center text-3xl mx-auto">
            <i className="ri-mail-check-line" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Offer Letters Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate your first offer letter directly from candidate and requisition records without manual retyping.
          </p>
          <button
            type="button"
            onClick={() => onOpenCreateProposal()}
            className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <i className="ri-add-line" />
            Create First Salary Proposal
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Offer Ref</th>
                  <th className="py-3 px-4">Candidate &amp; Role</th>
                  <th className="py-3 px-4">Business Unit &amp; Dept</th>
                  <th className="py-3 px-4">Compensation Package</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredOffers.map((offer) => {
                  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.salary_proposal;
                  const totalAllowances = (offer.allowances || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50/70 transition-colors">
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
                          {((offer.special_terms || "").toLowerCase().includes("qualification") ||
                            (offer.proposal_notes || "").toLowerCase().includes("qualification")) && (
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
                        <span className="text-[10px] text-slate-400">
                          {offer.employment_type}
                        </span>
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
                          <span className="block text-[10px] text-rose-600 font-medium mt-1 max-w-[180px] truncate" title={offer.rejection_reason}>
                            Reason: {offer.rejection_reason}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Step 2: BU CEO Approval (Actionable in BU) */}
                          {(offer.status === "pending_bu_ceo" || (offer.status === "salary_proposal" && getOfferSignatories(offer).bu_ceo.status !== "approved")) && (
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

                          {/* Export Word (.docx) & PDF Buttons (Always available once draft is generated) */}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
