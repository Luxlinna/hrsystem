import { memo } from "react";

interface IssueOfferPanelProps {
  expiryDate: string;
  setExpiryDate: (v: string) => void;
}

export const IssueOfferPanel = memo(function IssueOfferPanel({
  expiryDate,
  setExpiryDate,
}: IssueOfferPanelProps) {
  return (
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
  );
});
