import { memo, Fragment } from "react";
import { Link } from "react-router-dom";

interface LeaveRequestsSectionProps {
  showLeave: boolean;
  leaveRequests: any[];
}

export const LeaveRequestsSection = memo(function LeaveRequestsSection({
  showLeave,
  leaveRequests,
}: LeaveRequestsSectionProps) {
  if (!showLeave) return null;

  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Leave Requests</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Latest time-off requests submitted by team members</p>
          </div>
          <Link to="/leave" className="text-[11px] text-[#253C7D] font-bold hover:underline">
            View All
          </Link>
        </div>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-4 bg-gray-50 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>Employee</span>
            <span>Type</span>
            <span>Dates</span>
            <span>Status</span>
          </div>
          {leaveRequests.length > 0 ? (
            leaveRequests.map((l) => (
              <Fragment key={l.id}>
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-4 px-4 py-3 border-t border-gray-50 text-[13px]">
                  <span className="text-gray-900 font-medium truncate">
                    {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                  </span>
                  <span className="text-gray-600 capitalize">{l.leave_type}</span>
                  <span className="text-gray-500">
                    {l.start_date?.slice(5)} - {l.end_date?.slice(5)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        l.status === "approved"
                          ? "bg-emerald-500"
                          : l.status === "pending"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="text-gray-600 capitalize">{l.status}</span>
                  </span>
                </div>
                {/* Mobile card */}
                <div className="sm:hidden flex items-center justify-between px-4 py-3 border-t border-gray-50">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">
                      {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                    </p>
                    <p className="text-[11px] text-gray-500 capitalize mt-0.5">
                      {l.leave_type} &middot; {l.start_date?.slice(5)} – {l.end_date?.slice(5)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ml-2 ${
                      l.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : l.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              </Fragment>
            ))
          ) : (
            <p className="text-center py-8 text-[13px] text-gray-400">No leave requests yet</p>
          )}
        </div>
      </div>
    </div>
  );
});
