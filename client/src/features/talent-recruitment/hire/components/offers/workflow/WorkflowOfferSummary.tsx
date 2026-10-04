import { memo } from "react";
import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";
import { getOfferSignatories } from "../../../services/offerLetterService";

interface WorkflowOfferSummaryProps {
  offer: OfferLetter;
  modalType: WorkflowModalType;
  canActOnStep: boolean;
  roleName?: string;
}

export const WorkflowOfferSummary = memo(function WorkflowOfferSummary({
  offer,
  modalType,
  canActOnStep,
  roleName,
}: WorkflowOfferSummaryProps) {
  const totalAllowances = (offer.allowances || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;
  const sigs = getOfferSignatories(offer);

  const isBasedOnQual =
    (offer.special_terms || "").toLowerCase().includes("qualification") ||
    (offer.proposal_notes || "").toLowerCase().includes("qualification");

  return (
    <div className="space-y-4">
      {!canActOnStep && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <i className="ri-shield-keyhole-line text-amber-600 text-xl shrink-0" />
          <div>
            <strong className="block font-bold">Role Permission Notice</strong>
            <span>
              Your active role (<strong>{roleName || "User"}</strong>) does not have permission to execute this workflow step. Only designated executives can sign off.
            </span>
          </div>
        </div>
      )}

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
            {isBasedOnQual && (
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

      {/* 4-Tier Corporate Authorization Progress Strip */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Recruitment Authorization Chain
        </span>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div
            className={`p-1.5 rounded-lg border text-[11px] ${
              sigs.bu_ceo.status === "approved"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                : modalType === "bu_ceo_approval"
                ? "bg-blue-50 border-blue-300 text-blue-800 font-bold ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <div className="text-[9px] uppercase font-bold text-slate-400">1. BU CEO</div>
            <div className="truncate">
              {sigs.bu_ceo.status === "approved" ? "✓ Approved" : modalType === "bu_ceo_approval" ? "Active" : "Pending"}
            </div>
          </div>
          <div
            className={`p-1.5 rounded-lg border text-[11px] ${
              sigs.hr_manager.status === "approved"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                : modalType === "hr_manager_approval" || modalType === "hr_review"
                ? "bg-blue-50 border-blue-300 text-blue-800 font-bold ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <div className="text-[9px] uppercase font-bold text-slate-400">2. HR Mgr</div>
            <div className="truncate">
              {sigs.hr_manager.status === "approved"
                ? "✓ Approved"
                : modalType === "hr_manager_approval" || modalType === "hr_review"
                ? "Active"
                : "Pending"}
            </div>
          </div>
          <div
            className={`p-1.5 rounded-lg border text-[11px] ${
              sigs.hr_director.status === "approved"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                : modalType === "hr_director_approval"
                ? "bg-blue-50 border-blue-300 text-blue-800 font-bold ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <div className="text-[9px] uppercase font-bold text-slate-400">3. HR Director</div>
            <div className="truncate">
              {sigs.hr_director.status === "approved"
                ? "✓ Approved"
                : modalType === "hr_director_approval"
                ? "Active"
                : "Pending"}
            </div>
          </div>
          <div
            className={`p-1.5 rounded-lg border text-[11px] ${
              sigs.chairwoman.status === "approved"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                : modalType === "chairwoman_approval" || modalType === "management_approval"
                ? "bg-blue-50 border-blue-300 text-blue-800 font-bold ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <div className="text-[9px] uppercase font-bold text-slate-400">4. Chairwoman</div>
            <div className="truncate">
              {sigs.chairwoman.status === "approved"
                ? "✓ Approved"
                : modalType === "chairwoman_approval" || modalType === "management_approval"
                ? "Active"
                : "Pending"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
