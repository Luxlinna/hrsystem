import type { OfferLetter, Candidate, HiringRequest } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";
import { useOffersTabState } from "./tab/useOffersTabState";
import { OffersMetricsRow } from "./tab/OffersMetricsRow";
import { OffersFilterBar } from "./tab/OffersFilterBar";
import { OffersEmptyState } from "./tab/OffersEmptyState";
import { OfferTableRow } from "./tab/OfferTableRow";

export interface OffersTabContentProps {
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

export function OffersTabContent({
  offers,
  loading,
  onOpenCreateProposal,
  onOpenWorkflowModal,
  onExportPdf,
  onExportWord,
  onDeleteOffer,
}: OffersTabContentProps) {
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    departments,
    filteredOffers,
    metrics,
  } = useOffersTabState(offers);

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <OffersMetricsRow metrics={metrics} />

      {/* Filter and Action Bar */}
      <OffersFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        departments={departments}
        totalOffersCount={offers.length}
        metrics={metrics}
        onOpenCreateProposal={() => onOpenCreateProposal()}
      />

      {/* Offers Table / Empty / Loading */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <i className="ri-loader-4-line text-3xl animate-spin block mb-2" />
          <span>Loading offer letters...</span>
        </div>
      ) : filteredOffers.length === 0 ? (
        <OffersEmptyState onOpenCreateProposal={() => onOpenCreateProposal()} />
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
                {filteredOffers.map((offer) => (
                  <OfferTableRow
                    key={offer.id}
                    offer={offer}
                    isCurrentScopeHr={isCurrentScopeHr}
                    onOpenWorkflowModal={onOpenWorkflowModal}
                    onExportWord={onExportWord}
                    onExportPdf={onExportPdf}
                    onDeleteOffer={onDeleteOffer}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
