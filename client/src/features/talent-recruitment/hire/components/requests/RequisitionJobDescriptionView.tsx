import { memo, useState } from "react";
import type { HiringRequest } from "../../types";
import { exportHiringRequestPdf } from "../../exports/exportHiringRequestPdf";

interface Props {
  request: HiringRequest;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onOpenExport?: (req: HiringRequest, mode: "full_requisition" | "job_description") => void;
}

export const RequisitionJobDescriptionView = memo(function RequisitionJobDescriptionView({
  request: r,
  collapsible = true,
  defaultExpanded = false,
  onOpenExport,
}: Props) {
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);

  const hasStructuredJd = Boolean(
    r.jd_summary || r.jd_responsibilities || r.jd_requirements || r.jd_qualifications || r.jd_reporting_line
  );

  if (!hasStructuredJd && !r.job_description) {
    return null;
  }

  return (
    <div className="mt-2 rounded-xl border border-blue-100/80 bg-blue-50/30 overflow-hidden text-[11px] transition-all">
      {collapsible && (
        <div className="w-full px-3 py-1.5 flex items-center justify-between font-bold text-blue-900 bg-blue-50/40 transition-colors">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 text-left hover:text-blue-700 cursor-pointer text-[11px]"
          >
            <i className="ri-file-text-line text-blue-600 text-xs" />
            <span>Job Description & Role Requirements</span>
            {hasStructuredJd && (
              <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-blue-100 text-blue-800 font-extrabold">
                Structured Spec
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onOpenExport
                  ? onOpenExport(r, "job_description")
                  : exportHiringRequestPdf(r, { mode: "job_description", buLogo: "" })
              }
              title="Export Job Description Form PDF"
              className="px-2 py-0.5 rounded-md bg-white hover:bg-blue-50 text-[#253C7D] border border-blue-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-file-pdf-2-line text-rose-600 text-xs" /> Export JD Form
            </button>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-blue-600 flex items-center gap-0.5 font-semibold text-[10.5px] hover:text-blue-800 cursor-pointer"
            >
              {expanded ? "Hide Details" : "View Full JD"}
              <i className={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-3.5 bg-white/70 border-t border-blue-100/60">
          {/* Organization & Hierarchy Meta */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] pb-2 border-b border-gray-100">
            <span className="font-semibold text-gray-500">Context:</span>
            {r.company && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                Entity: {r.company}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
              BU: {r.business_unit || r.branches?.name || "Enterprise"}
            </span>
            {r.site && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                Site: {r.site}
              </span>
            )}
            {r.division && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                Division: {r.division}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
              Dept: {r.department}
            </span>
            {r.employee_level && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                Level: {r.employee_level}
              </span>
            )}
            {r.contract_type && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                Contract: {r.contract_type}
              </span>
            )}
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
