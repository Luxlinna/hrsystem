import React, { useState } from "react";

interface ProfileApplicationHistoryProps {
  applications: any[];
}

export function ProfileApplicationHistory({ applications }: ProfileApplicationHistoryProps) {
  const [showHistory, setShowHistory] = useState(true);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
      <div
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <i className="ri-history-line text-[16px]"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900">
              Application & Outcome History
            </h4>
            <p className="text-[12px] text-gray-500">
              {applications.length > 0
                ? `${applications.length} recorded application${applications.length > 1 ? "s" : ""} across hiring pipelines`
                : "All historical job submissions linked to your candidate ID"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#253C7D] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {applications.length} Record{applications.length !== 1 ? "s" : ""}
          </span>
          <i
            className={`ri-arrow-down-s-line text-lg text-gray-400 transition-transform ${
              showHistory ? "rotate-180" : ""
            }`}
          ></i>
        </div>
      </div>

      {showHistory && (
        <div className="pt-3 space-y-3">
          {applications.length > 0 ? (
            applications.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-gray-50/80 hover:bg-slate-50 border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-900">
                      {app.job_posting?.title || "Direct Candidate Submission"}
                    </span>
                    {app.job_posting?.department && (
                      <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                        {app.job_posting.department}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>
                      Applied:{" "}
                      <strong className="text-gray-600">
                        {new Date(app.applied_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                    {app.source && (
                      <>
                        <span>&middot;</span>
                        <span>Via {app.source}</span>
                      </>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-[12px] text-gray-600 italic bg-white/70 p-2 rounded-xl border border-gray-200/50 mt-1">
                      "{app.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {app.stage}
                  </span>
                  {app.outcome && (
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        app.outcome === "hired"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : app.outcome === "rejected"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-slate-200 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {app.outcome.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
              <i className="ri-inbox-line text-2xl text-gray-300 mb-1 block"></i>
              <p className="text-[12px] font-medium text-gray-500">
                No previous recruitment applications linked yet.
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                When you apply or get considered for vacancies, records will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
