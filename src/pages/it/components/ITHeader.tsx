import { memo } from "react";
import type { ITAsset, ITTicket, ITTabType } from "../types";
import { ITExportMenu } from "./ITExportMenu";

interface ITHeaderProps {
  canManage: boolean;
  branchName?: string;
  activeAssetsCount: number;
  openTicketsCount: number;
  onOpenAssetModal: () => void;
  onOpenTicketModal: () => void;
  tab?: ITTabType;
  assets?: ITAsset[];
  tickets?: ITTicket[];
}

export const ITHeader = memo(function ITHeader({
  canManage,
  branchName,
  activeAssetsCount,
  onOpenAssetModal,
  onOpenTicketModal,
  tab = "assets",
  assets = [],
  tickets = [],
}: ITHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Infrastructure &amp; Operations</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">IT Helpdesk &amp; Assets</span>
          {branchName && (
            <>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 font-bold text-[10px] flex items-center gap-1">
                <i className="ri-building-line text-[10px]" /> {branchName}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          IT Management &amp; Assets
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {activeAssetsCount} Deployed Assets
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track company hardware assets, resolve employee IT support tickets, and review endpoint security safeguards.
        </p>
      </div>

      {/* Top Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* 3-Format Export Dropdown */}
        <ITExportMenu
          tab={tab}
          assets={assets}
          tickets={tickets}
        />

        <button
          onClick={onOpenTicketModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-customer-service-2-line text-amber-600 text-sm" />
          Log IT Ticket
        </button>

        {canManage && (
          <button
            onClick={onOpenAssetModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-circle-line text-base font-bold" />
            Register Asset
          </button>
        )}
      </div>
    </div>
  );
});
