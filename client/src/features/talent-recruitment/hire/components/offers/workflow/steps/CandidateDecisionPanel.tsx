import { memo } from "react";

interface CandidateDecisionPanelProps {
  decision: "accepted" | "rejected";
  setDecision: (v: "accepted" | "rejected") => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  signedFile: File | null;
  setSignedFile: (f: File | null) => void;
}

export const CandidateDecisionPanel = memo(function CandidateDecisionPanel({
  decision,
  setDecision,
  rejectionReason,
  setRejectionReason,
  otherReason,
  setOtherReason,
  signedFile,
  setSignedFile,
}: CandidateDecisionPanelProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-slate-700 block">Candidate Decision</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setDecision("accepted")}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
            decision === "accepted"
              ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <i className="ri-checkbox-circle-fill text-lg text-emerald-600 block mb-1" />
          <span className="text-xs">Candidate Accepted</span>
        </button>

        <button
          type="button"
          onClick={() => setDecision("rejected")}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
            decision === "rejected"
              ? "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 font-bold"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <i className="ri-close-circle-fill text-lg text-rose-600 block mb-1" />
          <span className="text-xs">Candidate Declined</span>
        </button>
      </div>

      {decision === "accepted" && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <i className="ri-attachment-2 text-indigo-600" />
              Attach Physical Signed Scan / PDF (Optional)
            </label>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              AWS S3 Archive
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            If candidate returned a scanned signed contract or signed PDF, attach it here to upload and archive directly to AWS S3.
          </p>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setSignedFile(file || null);
            }}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {signedFile && (
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <i className="ri-checkbox-circle-fill text-emerald-600" />
              <span>Attached: {signedFile.name} ({(signedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>
      )}

      {decision === "rejected" && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <label className="text-xs font-semibold text-slate-700 block">Primary Decline Reason</label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="Accepted competing offer">Accepted competing offer</option>
            <option value="Salary expectation not met">Salary expectation not met</option>
            <option value="Counter-offer from current employer">Counter-offer from current employer</option>
            <option value="Commute distance / Location">Commute distance / Location</option>
            <option value="Personal / Family circumstances">Personal / Family circumstances</option>
            <option value="Other">Other reason...</option>
          </select>

          {rejectionReason === "Other" && (
            <input
              type="text"
              placeholder="Specify reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          )}
        </div>
      )}
    </div>
  );
});
