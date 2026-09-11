import { memo } from "react";
import type { CandidateApprovalSignatory } from "../../../types";

interface SignatoryCardProps {
  stepNumber: number;
  subtitle: string;
  signatory: CandidateApprovalSignatory;
  onCommentChange: (comment: string) => void;
  onSign: () => void;
}

export const SignatoryCard = memo(function SignatoryCard({
  stepNumber,
  subtitle,
  signatory,
  onCommentChange,
  onSign,
}: SignatoryCardProps) {
  const isApproved = signatory.status === "approved";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider block">
            STEP {stepNumber} • {subtitle}
          </span>
          <h4 className="text-sm font-extrabold text-gray-900">
            {signatory.title}
          </h4>
          <p className="text-xs text-gray-500 font-medium">
            {signatory.assigned_name}
          </p>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            isApproved
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isApproved ? "Signed" : "Pending"}
        </span>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 block mb-1">
          Comment
        </label>
        <textarea
          rows={2}
          value={signatory.comment || ""}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Enter sign-off comment or remarks..."
          className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-gray-50/50"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-[10px] text-gray-400">
          {signatory.signed_at
            ? `Signed on ${new Date(signatory.signed_at).toLocaleDateString()}`
            : "Awaiting sign-off"}
        </div>
        {!isApproved && (
          <button
            type="button"
            onClick={onSign}
            className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Sign as {signatory.title.split("/")[0].trim()}
          </button>
        )}
      </div>
    </div>
  );
});
