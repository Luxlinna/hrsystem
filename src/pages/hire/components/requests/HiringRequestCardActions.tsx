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
    <div className="flex items-center gap-2 lg:flex-col shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
      <button
        type="button"
        onClick={() => (onOpenExport ? onOpenExport(r, "full_requisition") : exportHiringRequestPdf(r, { mode: "full_requisition", buLogo: "" }))}
        title="Export Official Personnel Requisition PDF Form (with Multi-Stage Approvals)"
        className="flex-1 lg:w-48 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#253C7D] font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 hover:border-[#253C7D] cursor-pointer shadow-2xs transition-all"
      >
        <i className="ri-file-pdf-2-line text-rose-600 text-sm" /> Export PDF Form
      </button>
      {canActStage1 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-48 py-2.5 px-3 rounded-xl bg-[#253C7D] hover:bg-[#1B2B5A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-send-plane-fill text-sm" /> Endorse Requisition
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-48 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-sm" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage2 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-48 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-user-star-line text-sm" /> HR Review & Endorse
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-48 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-sm" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage3 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-48 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-shield-star-line text-sm" /> HR Admin Director Approve
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-48 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-sm" /> Reject Requisition
          </button>
        </>
      )}

      {canActStage4 && (
        <>
          <button
            onClick={() => onOpenDecision(r, "approved")}
            className="flex-1 lg:w-48 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="ri-vip-crown-line text-sm" /> Authorize & Go Live
          </button>
          <button
            onClick={() => onOpenDecision(r, "rejected")}
            className="flex-1 lg:w-48 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
          >
            <i className="ri-close-line text-sm" /> Reject Requisition
          </button>
        </>
      )}

      {onDelete && canDelete && (
        <button
          onClick={() => onDelete(r.id)}
          title="Delete Requisition"
          className="py-2 px-3 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-200 hover:border-rose-200 cursor-pointer lg:w-48"
        >
          <i className="ri-delete-bin-line text-sm" /> Delete Requisition
        </button>
      )}
    </div>
  );
});
