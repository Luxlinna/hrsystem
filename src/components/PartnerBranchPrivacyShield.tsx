import { memo } from "react";

interface PartnerBranchPrivacyShieldProps {
  moduleName: string;
  description?: string;
  userBranchName?: string | null;
  hasNoBranch?: boolean;
}

export const PartnerBranchPrivacyShield = memo(function PartnerBranchPrivacyShield({
  moduleName,
  description,
  userBranchName,
  hasNoBranch,
}: PartnerBranchPrivacyShieldProps) {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm text-center animate-in zoom-in-95 duration-150">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
        <i className="ri-shield-keyhole-line" />
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
        Partner Branch {moduleName} Privacy Shield
      </h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
        {description ||
          `Records, employee operations, workflows, and policies for this partner branch are strictly confidential to its assigned branch members. Super Admins and users cannot view or audit data of other partner branches.`}
      </p>
      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold text-left flex items-start gap-2.5">
        <i className="ri-lock-line text-base shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Access Restricted to Home Branch</p>
          <p className="text-[11px] opacity-90 mt-0.5">
            {!hasNoBranch && userBranchName
              ? `You are assigned to ${userBranchName}. Please switch back to your home branch in the header switcher to view your ${moduleName.toLowerCase()} data.`
              : "You are not assigned to any branch. Please contact your company administrator to assign you to a branch."}
          </p>
        </div>
      </div>
    </div>
  );
});
