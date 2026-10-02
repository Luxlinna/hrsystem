import { memo } from "react";
import type { CandidateApprovalSignatory } from "../../../types";

interface SignatoryCardProps {
  stepNumber: number;
  subtitle: string;
  signatory: CandidateApprovalSignatory;
  isLocked?: boolean;
  waitingForTitle?: string | null;
  canSign?: boolean;
  requiresPermissionHint?: string;
  currentUserName?: string;
  onCommentChange: (comment: string) => void;
  onSign: () => void;
}

export const SignatoryCard = memo(function SignatoryCard({
  stepNumber,
  subtitle,
  signatory,
  isLocked = false,
  waitingForTitle,
  canSign = true,
  requiresPermissionHint,
  currentUserName,
  onCommentChange,
  onSign,
}: SignatoryCardProps) {
  const isApproved = signatory.status === "approved";
  const isDifferentUser = currentUserName && signatory.assigned_name && currentUserName !== signatory.assigned_name;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-2xs space-y-3 transition-all ${
        isLocked
          ? "bg-gray-50/60 border-dashed border-gray-300 opacity-75"
          : isApproved
            ? "bg-white border-emerald-200"
            : "bg-white border-gray-200 hover:border-[#253C7D]/30"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-wider block ${
              isLocked ? "text-gray-400" : isApproved ? "text-emerald-600" : "text-[#253C7D]"
            }`}
          >
            STEP {stepNumber} • {subtitle}
          </span>
          <h4 className="text-sm font-extrabold text-gray-900">{signatory.title}</h4>
          <p className="text-xs text-gray-500 font-medium">{signatory.assigned_name}</p>
        </div>

        <span
          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            isApproved
              ? "bg-emerald-100 text-emerald-800"
              : isLocked
                ? "bg-gray-200 text-gray-600"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {isApproved ? (
            <>
              <i className="ri-checkbox-circle-fill text-emerald-600" /> Signed
            </>
          ) : isLocked ? (
            <>
              <i className="ri-lock-line" /> Locked
            </>
          ) : (
            <>
              <i className="ri-time-line text-amber-600" /> Pending Sign
            </>
          )}
        </span>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 block mb-1">Comment</label>
        <textarea
          rows={2}
          value={signatory.comment || ""}
          disabled={isLocked || isApproved}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={
            isLocked
              ? `Locked — awaiting ${waitingForTitle || "previous step"} first...`
              : "Enter sign-off comment or remarks..."
          }
          className={`w-full text-xs p-2 rounded-xl border focus:outline-none transition-all ${
            isLocked
              ? "border-gray-200 bg-gray-100/60 text-gray-400 cursor-not-allowed"
              : "border-gray-200 focus:ring-2 focus:ring-[#253C7D] bg-gray-50/50"
          }`}
        />
      </div>

      <div className="flex items-center justify-between pt-1 min-h-[32px]">
        <div className="text-[10px] text-gray-400">
          {isApproved ? (
            <span className="text-emerald-700 font-medium">
              Signed by {signatory.checked_by || signatory.assigned_name}{" "}
              {signatory.signed_at ? `on ${new Date(signatory.signed_at).toLocaleDateString()}` : ""}
            </span>
          ) : isLocked ? (
            <span className="text-gray-400 italic">
              <i className="ri-lock-line text-xs" /> Awaiting {waitingForTitle} sign-off
            </span>
          ) : (
            <span>
              {isDifferentUser ? (
                <span className="text-indigo-600 font-medium">
                  Acting: {currentUserName} (Staff Delegate)
                </span>
              ) : (
                "Awaiting authorized signature"
              )}
            </span>
          )}
        </div>

        {!isApproved && !isLocked && (
          canSign ? (
            <button
              type="button"
              onClick={onSign}
              className="px-3 py-1 bg-[#253C7D] hover:bg-[#1d3065] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
            >
              <i className="ri-edit-line text-xs" />
              Sign as {signatory.title.split("/")[0].trim()}
            </button>
          ) : (
            <div
              title={requiresPermissionHint || "Role permission required"}
              className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-help"
            >
              <i className="ri-shield-keyhole-line" /> Permission Required
            </div>
          )
        )}
      </div>
    </div>
  );
});
