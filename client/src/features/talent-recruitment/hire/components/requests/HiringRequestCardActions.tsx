import { memo } from "react";
import type { HiringRequest } from "../../types";
import { exportHiringRequestPdf } from "../../exports/exportHiringRequestPdf";

interface Props {
  request: HiringRequest;
  canActStage1: boolean;
  canActStage2: boolean;
  canActStage3: boolean;
  canActStage4: boolean;
  canDelete: boolean;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  onOpenExport?: (req: HiringRequest, mode: "full_requisition" | "job_description") => void;
}

export const HiringRequestCardActions = memo(function HiringRequestCardActions({
  request: r,
  canActStage1,
  canActStage2,
  canActStage3,
  canActStage4,
  canDelete,
  onOpenDecision,
  onDelete,
  onOpenExport,
}: Props) {
  return (
    <div className="flex items-center gap-1.5 lg:flex-col shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-gray-100">
      <button
        type="button"
        onClick={() => (onOpenExport ? onOpenExport(r, "full_requisition") : exportHiringRequestPdf(r, { mode: "full_requisition", buLogo: "" }))}
        title="Export Official Personnel Requisition PDF Form (with Multi-Stage Approvals)"
        className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-[#253C7D] font-bold text-[11px] flex items-center justify-center gap-1.5 border border-blue-200 hover:border-[#253C7D] cursor-pointer shadow-2xs transition-all"
      >
        <i className="ri-file-pdf-2-line text-rose-600 text-xs" /> Export PDF Form
      </button>
      {canActStage1 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-[#253C7D] hover:bg-[#1B2B5A] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-checkbox-circle-line text-xs" /> Approve Requisition
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-xs" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage2 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-user-star-line text-xs" /> HR Review & Endorse
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-xs" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage3 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-shield-star-line text-xs" /> HR Director Approve
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-xs" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage4 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-vip-crown-line text-xs" /> Authorize & Go Live
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-40 py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-xs" /> Reject Requisition
          </button>
        </>
      )}

      {onDelete && canDelete && (
        <button
          onClick={() => onDelete(r.id)}
          title="Delete Requisition"
          className="py-1.5 px-2.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-gray-200 hover:border-rose-200 cursor-pointer lg:w-40 transition-colors"
        >
          <i className="ri-delete-bin-line text-xs" /> Delete Requisition
        </button>
      )}
    </div>
  );
});
