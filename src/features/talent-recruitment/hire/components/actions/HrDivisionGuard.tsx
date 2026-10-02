import { memo } from "react";

export const HrDivisionGuard = memo(function HrDivisionGuard() {
  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 p-8 sm:p-12 text-center shadow-2xs">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-200">
        <i className="ri-shield-keyhole-line" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">HR Division Exclusive Workflow</h2>
      <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto mb-6">
        The <strong>My Recruitment Actions</strong> view is strictly scoped to the <strong>HR Division</strong>. Your current workspace branch is not set to the HR Division.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
        <i className="ri-information-line text-blue-500" />
        Switch your active branch scope to <strong>HR Division</strong> or <strong>All Branches</strong> to access this action inbox.
      </div>
    </div>
  );
});
