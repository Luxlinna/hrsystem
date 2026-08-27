import { memo } from "react";
import { Link } from "react-router-dom";
import type { ReportEntry } from "../../types";

interface ProfileSidebarProps {
  manager: ReportEntry | null;
  reports: ReportEntry[];
  interviews: any[];
}

export const ProfileSidebar = memo(function ProfileSidebar({
  manager,
  reports,
  interviews,
}: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Org Drill-down */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Reporting Line</h3>
        {manager && (
          <Link
            to={`/employees/${manager.id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
              {manager.first_name[0]}
              {manager.last_name[0]}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                {manager.first_name} {manager.last_name}
              </p>
              <p className="text-[11px] text-gray-500">{manager.role} — Manager</p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 ml-auto" />
          </Link>
        )}
        {!manager && <p className="text-[13px] text-gray-400">No manager assigned</p>}
      </div>

      {/* Direct Reports */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-bold text-[#1A1A1A]">Direct Reports</h3>
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {reports.length}
          </span>
        </div>
        <div className="space-y-2">
          {reports.length > 0 ? (
            reports.map((r) => (
              <Link
                key={r.id}
                to={`/employees/${r.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-xs">
                  {r.first_name[0]}
                  {r.last_name[0]}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    {r.first_name} {r.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500">{r.role}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-[13px] text-gray-400">No direct reports</p>
          )}
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-bold text-[#1A1A1A]">Assigned Interviews</h3>
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {interviews.length}
          </span>
        </div>
        <div className="space-y-3">
          {interviews.length > 0 ? (
            interviews.slice(0, 4).map((iv) => (
              <div key={iv.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {iv.candidates?.full_name || "Candidate"}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      iv.status === "scheduled"
                        ? "bg-blue-50 text-blue-700"
                        : iv.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {iv.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{iv.candidates?.job_postings?.title || "—"}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                  <span className="flex items-center gap-0.5">
                    <i className="ri-calendar-line" />{" "}
                    {iv.scheduled_at
                      ? new Date(iv.scheduled_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "TBD"}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <i className="ri-time-line" /> {iv.duration_minutes}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <i className="ri-video-chat-line" /> {iv.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-gray-400">No interviews assigned.</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Quick Actions</h3>
        <div className="space-y-1">
          <Link
            to="/leave"
            className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-calendar-event-line text-gray-400" /> Request Leave
          </Link>
          <Link
            to="/payroll-module"
            className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-money-dollar-circle-line text-gray-400" /> View Payslips
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-settings-3-line text-gray-400" /> Account Settings
          </Link>
        </div>
      </div>
    </div>
  );
});
