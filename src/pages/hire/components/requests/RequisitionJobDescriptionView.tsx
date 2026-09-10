import { memo, useState } from "react";
import type { HiringRequest } from "../../types";

interface Props {
  request: HiringRequest;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const RequisitionJobDescriptionView = memo(function RequisitionJobDescriptionView({
  request: r,
  collapsible = true,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);

  const hasStructuredJd = Boolean(
    r.jd_summary || r.jd_responsibilities || r.jd_requirements || r.jd_qualifications || r.jd_reporting_line
  );

  if (!hasStructuredJd && !r.job_description) {
    return null;
  }

  return (
    <div className="mt-2.5 rounded-2xl border border-blue-100/80 bg-blue-50/30 overflow-hidden text-xs transition-all">
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full px-3.5 py-2 flex items-center justify-between font-bold text-blue-900 hover:bg-blue-50/80 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <i className="ri-file-text-line text-blue-600" />
            <span>Job Description & Role Requirements</span>
            {hasStructuredJd && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
                Structured Spec
              </span>
            )}
          </span>
          <span className="text-blue-600 flex items-center gap-1 font-semibold text-[11px]">
            {expanded ? "Hide Details" : "View Full JD"}
            <i className={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
          </span>
        </button>
      )}

      {expanded && (
        <div className="p-4 space-y-3.5 bg-white/70 border-t border-blue-100/60">
          {/* Organization & Hierarchy Meta */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] pb-2 border-b border-gray-100">
            <span className="font-semibold text-gray-500">Auto-filled Context:</span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
              BU: {r.business_unit || r.branches?.name || "Enterprise"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
              Dept: {r.department}
            </span>
            {r.jd_reporting_line && (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center gap-1">
                <i className="ri-git-merge-line text-purple-600" />
                {r.jd_reporting_line}
              </span>
            )}
          </div>

          {/* 1. Job Summary */}
          {(r.jd_summary || (!hasStructuredJd && r.job_description)) && (
            <div>
              <p className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <i className="ri-information-line text-blue-600" /> 1. Role Purpose & Summary
              </p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-blue-300">
                {r.jd_summary || r.job_description}
              </p>
            </div>
          )}

          {/* 2. Responsibilities */}
          {r.jd_responsibilities && (
            <div>
              <p className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <i className="ri-task-line text-emerald-600" /> 2. Key Responsibilities & Duties
              </p>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-emerald-300">
                {r.jd_responsibilities}
              </div>
            </div>
          )}

          {/* 3. Requirements */}
          {r.jd_requirements && (
            <div>
              <p className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <i className="ri-checkbox-circle-line text-amber-600" /> 3. Core Competencies & Skills
              </p>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-amber-300">
                {r.jd_requirements}
              </div>
            </div>
          )}

          {/* 4. Qualifications */}
          {r.jd_qualifications && (
            <div>
              <p className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <i className="ri-award-line text-indigo-600" /> 4. Education & Certifications
              </p>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-indigo-300">
                {r.jd_qualifications}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
